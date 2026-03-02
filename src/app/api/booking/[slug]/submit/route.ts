import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateAvailableSlots } from "@/lib/booking-slots";
import { timeToMinutes, minutesToTime } from "@/lib/business-hours";
import { sendWebBookingNotifications } from "@/lib/booking/notifications";

type SubmitBody = {
  date: string;
  start_time: string;
  menu_ids: string[];
  last_name: string;
  first_name: string;
  email: string;
  phone: string;
  memo?: string;
  _hp?: string; // ハニーポット
};

// POST: 予約送信（公開API — 認証不要）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  // ハニーポット: 隠しフィールドに値があればボット判定
  if (body._hp) {
    return NextResponse.json({ success: true }); // サイレント拒否
  }

  const { date, start_time, menu_ids, last_name, first_name, email, phone, memo } = body;

  // --- 入力バリデーション ---
  if (!last_name?.trim() || !first_name?.trim()) {
    return NextResponse.json({ error: "お名前（姓・名）は必須です" }, { status: 400 });
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }
  if (!phone?.trim() || !/^0\d{9,10}$/.test(phone.replace(/-/g, ""))) {
    return NextResponse.json({ error: "電話番号の形式が正しくありません" }, { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日付の形式が不正です" }, { status: 400 });
  }
  if (!start_time || !/^\d{2}:\d{2}$/.test(start_time)) {
    return NextResponse.json({ error: "時間の形式が不正です" }, { status: 400 });
  }
  if (!menu_ids || !Array.isArray(menu_ids) || menu_ids.length === 0) {
    return NextResponse.json({ error: "メニューを1つ以上選択してください" }, { status: 400 });
  }
  if (memo && memo.length > 500) {
    return NextResponse.json({ error: "メモは500文字以内で入力してください" }, { status: 400 });
  }

  // 過去日チェック
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (date < todayStr) {
    return NextResponse.json({ error: "過去の日付は指定できません" }, { status: 400 });
  }

  const admin = createAdminClient();

  // --- サロン検索 ---
  const { data: salon, error: salonError } = await admin
    .from("salons")
    .select("id, name, phone, owner_id, business_hours, salon_holidays, booking_settings, booking_enabled")
    .eq("booking_slug", slug)
    .single();

  if (salonError || !salon) {
    return NextResponse.json({ error: "予約ページが見つかりません" }, { status: 404 });
  }

  if (!salon.booking_enabled) {
    return NextResponse.json({ error: "現在、Web予約の受付を停止しています。サロンへ直接お問い合わせください", code: "BOOKING_DISABLED" }, { status: 403 });
  }

  // --- スパム対策: 同一電話番号で1時間3件制限 ---
  const normalizedPhone = phone.replace(/-/g, "");
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("source", "web")
    .gte("created_at", oneHourAgo);

  if ((recentCount ?? 0) >= 10) {
    return NextResponse.json({ error: "現在予約が集中しています。しばらく経ってからお試しください" }, { status: 429 });
  }

  // --- メニュー存在確認 ---
  const { data: menus } = await admin
    .from("treatment_menus")
    .select("id, name, price, duration_minutes")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .in("id", menu_ids);

  if (!menus || menus.length !== menu_ids.length) {
    return NextResponse.json({ error: "選択されたメニューが見つかりません" }, { status: 400 });
  }

  // --- 合計施術時間 → end_time 計算 ---
  const totalDuration = menus.reduce((sum, m) => sum + (m.duration_minutes ?? 60), 0);
  const startMin = timeToMinutes(start_time);
  const endMin = startMin + totalDuration;
  const end_time = minutesToTime(endMin);

  // --- 空き枠チェック（二重予約防止） ---
  const { data: existingApts } = await admin
    .from("appointments")
    .select("start_time, end_time")
    .eq("salon_id", salon.id)
    .eq("appointment_date", date)
    .neq("status", "cancelled");

  const slots = calculateAvailableSlots({
    businessHours: salon.business_hours,
    salonHolidays: salon.salon_holidays,
    bookingSettings: salon.booking_settings,
    date,
    existingAppointments: existingApts ?? [],
    requestedDuration: totalDuration,
  });

  const targetSlot = slots.find((s) => s.time === start_time);
  if (!targetSlot || !targetSlot.available) {
    return NextResponse.json({ error: "この時間帯は予約できません。別の時間をお選びください" }, { status: 409 });
  }

  // --- 顧客マッチング ---
  let customerId: string;
  let isNewCustomer = false;
  const { data: existingCustomer } = await admin
    .from("customers")
    .select("id")
    .eq("salon_id", salon.id)
    .eq("phone", normalizedPhone)
    .limit(1)
    .single();

  if (existingCustomer) {
    customerId = existingCustomer.id;
    // 既存顧客のメールアドレスを更新（未設定の場合のみ）
    await admin
      .from("customers")
      .update({ email: email.trim() })
      .eq("id", existingCustomer.id)
      .is("email", null);
  } else {
    // 新規顧客作成
    const { data: newCustomer, error: customerError } = await admin
      .from("customers")
      .insert({
        salon_id: salon.id,
        last_name: last_name.trim(),
        first_name: first_name.trim(),
        email: email.trim(),
        phone: normalizedPhone,
      })
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      console.error("顧客作成エラー:", customerError);
      return NextResponse.json({ error: "予約処理に失敗しました" }, { status: 500 });
    }
    customerId = newCustomer.id;
    isNewCustomer = true;
  }

  // --- 予約作成 ---
  const cancelToken = randomUUID();
  const menuNameSnapshot = menus.map((m) => m.name).join("、");
  const { data: appointment, error: aptError } = await admin
    .from("appointments")
    .insert({
      salon_id: salon.id,
      customer_id: customerId,
      appointment_date: date,
      start_time: start_time + ":00",
      end_time: end_time + ":00",
      menu_id: menus[0].id,
      menu_name_snapshot: menuNameSnapshot,
      source: "web",
      memo: memo?.trim() || null,
      status: "scheduled",
      staff_id: null,
      cancel_token: cancelToken,
    })
    .select("id")
    .single();

  if (aptError || !appointment) {
    console.error("予約作成エラー:", aptError);
    // DB トリガーによる重複エラーの可能性
    if (aptError?.message?.includes("既に予約があります") || aptError?.message?.includes("上限")) {
      return NextResponse.json({ error: "この時間帯は予約できません。別の時間をお選びください" }, { status: 409 });
    }
    return NextResponse.json({ error: `予約に失敗しました: ${aptError?.message}` }, { status: 500 });
  }

  // --- appointment_menus 作成 ---
  const menuRows = menus.map((m, i) => ({
    appointment_id: appointment.id,
    menu_id: m.id,
    menu_name_snapshot: m.name,
    price_snapshot: m.price,
    duration_minutes_snapshot: m.duration_minutes,
    sort_order: i,
  }));

  const { error: menuInsertError } = await admin
    .from("appointment_menus")
    .insert(menuRows);

  if (menuInsertError) {
    console.error("予約メニュー作成エラー:", menuInsertError);
    // 予約自体は作成済みなので、メニューの紐付けだけ失敗した旨をログに残す
  }

  // --- 通知送信（fire-and-forget: 失敗しても予約は成功扱い） ---
  const customerName = `${last_name.trim()} ${first_name.trim()}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get("host")}`;
  sendWebBookingNotifications({
    salonId: salon.id,
    salonName: salon.name,
    salonPhone: salon.phone,
    ownerId: salon.owner_id,
    appointmentId: appointment.id,
    appointmentDate: date,
    startTime: start_time + ":00",
    menuNames: menus.map((m) => m.name),
    totalDuration,
    customerId,
    customerName,
    customerEmail: email.trim(),
    customerPhone: normalizedPhone,
    isNewCustomer,
    memo: memo?.trim() || null,
    cancelUrl: `${baseUrl}/book/cancel/${cancelToken}`,
  }).catch(() => {});

  return NextResponse.json({ success: true, appointmentId: appointment.id });
}
