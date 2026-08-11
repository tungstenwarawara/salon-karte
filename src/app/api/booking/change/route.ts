import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateAvailableSlots } from "@/lib/booking-slots";
import {
  timeToMinutes,
  minutesToTime,
  todayStrInJst,
  jstDateStringAfterDays,
} from "@/lib/business-hours";
import { checkChangeDeadline } from "@/lib/booking/deadline";
import { getResendClient, getFromAddress } from "@/lib/email/client";
import {
  buildCustomerChangeConfirmationEmail,
  buildOwnerChangeNotificationEmail,
} from "@/lib/email/templates";
import type { BookingSettings, BusinessHours, HourOverrides } from "@/types/database";

// GET: トークンで予約情報・サロンメニュー・空き枠を取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const date = searchParams.get("date"); // 空き枠取得用（任意）

  if (!token) {
    return NextResponse.json({ error: "トークンが不正です" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: appointment, error } = await admin
    .from("appointments")
    .select("id, salon_id, customer_id, appointment_date, start_time, end_time, status, menu_name_snapshot, memo")
    .eq("cancel_token", token)
    .single();

  if (error || !appointment) {
    return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  }

  // サロン情報取得
  const { data: salon } = await admin
    .from("salons")
    .select("id, name, booking_slug, booking_enabled, business_hours, salon_holidays, hour_overrides, booking_settings")
    .eq("id", appointment.salon_id)
    .single<{
      id: string; name: string; booking_slug: string | null; booking_enabled: boolean;
      business_hours: BusinessHours | null; salon_holidays: string[] | null;
      hour_overrides: HourOverrides | null; booking_settings: BookingSettings | null;
    }>();

  if (!salon) {
    return NextResponse.json({ error: "サロンが見つかりません" }, { status: 404 });
  }

  // 締切切れ判定
  let deadlinePassed = false;
  if (appointment.status === "scheduled") {
    const err = await checkChangeDeadline(admin, appointment.salon_id, appointment.appointment_date, appointment.start_time);
    deadlinePassed = !!err;
  }

  // 現在の予約メニューを取得
  const { data: appointmentMenus } = await admin
    .from("appointment_menus")
    .select("menu_id, menu_name_snapshot, price_snapshot, duration_minutes_snapshot")
    .eq("appointment_id", appointment.id)
    .order("sort_order");

  // サロンのアクティブメニュー取得
  // treatment_menus に sort_order 列は存在しない。指定するとPostgRESTがエラーを返し
  // menus が null になって変更画面のメニュー選択が空になる（新規予約画面と同じ name 順で統一）
  const { data: menus, error: menusError } = await admin
    .from("treatment_menus")
    .select("id, name, price, duration_minutes")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (menusError) {
    console.error("メニュー取得エラー:", menusError.message);
    Sentry.captureException(menusError, { tags: { feature: "booking-change" } });
  }

  // 空き枠（日付が指定された場合）
  let slots: { time: string; available: boolean; reason?: string }[] = [];
  const targetDate = date || appointment.appointment_date;
  if (targetDate) {
    const { data: existingApts } = await admin
      .from("appointments")
      .select("id, start_time, end_time")
      .eq("salon_id", salon.id)
      .eq("appointment_date", targetDate)
      .neq("status", "cancelled");

    // 自分自身の予約を除外して空き枠を計算
    const filteredApts = (existingApts ?? [])
      .filter((a) => a.id !== appointment.id)
      .map(({ start_time, end_time }) => ({ start_time, end_time }));

    // メニューの合計時間を計算（変更画面用にはリクエスト側で duration を指定可能）
    const durationParam = searchParams.get("duration");
    const currentMenuDuration = (appointmentMenus ?? []).reduce(
      (sum, m) => sum + (m.duration_minutes_snapshot ?? 60), 0
    );
    const requestedDuration = durationParam ? parseInt(durationParam, 10) : currentMenuDuration;

    slots = calculateAvailableSlots({
      businessHours: salon.business_hours,
      salonHolidays: salon.salon_holidays,
      hourOverrides: salon.hour_overrides,
      bookingSettings: salon.booking_settings,
      date: targetDate,
      existingAppointments: filteredApts,
      requestedDuration: isNaN(requestedDuration) ? 60 : requestedDuration,
    });
  }

  return NextResponse.json({
    appointment: {
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      status: appointment.status,
      menuName: appointment.menu_name_snapshot,
      memo: appointment.memo,
      currentMenuIds: (appointmentMenus ?? []).map((m) => m.menu_id),
    },
    salon: {
      name: salon.name,
      bookingSlug: salon.booking_slug,
      bookingEnabled: salon.booking_enabled,
      businessHours: salon.business_hours,
      salonHolidays: salon.salon_holidays,
      hourOverrides: salon.hour_overrides,
    },
    menus: menus ?? [],
    slots,
    deadlinePassed,
  });
}

type ChangeBody = {
  token: string;
  date: string;
  start_time: string;
  menu_ids: string[];
};

// POST: 予約変更（公開API — cancel_tokenで認証）
export async function POST(request: Request) {
  let body: ChangeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { token, date, start_time, menu_ids } = body;

  // バリデーション
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "トークンが不正です" }, { status: 400 });
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

  // 過去日チェック（JST基準。calculateAvailableSlots と基準を揃える）
  if (date < todayStrInJst()) {
    return NextResponse.json({ error: "過去の日付は指定できません" }, { status: 400 });
  }
  // 変更先も公開ページと同じ60日先まで
  if (date > jstDateStringAfterDays(60)) {
    return NextResponse.json({ error: "60日先までしか予約できません" }, { status: 400 });
  }

  const admin = createAdminClient();

  // トークンで予約を検索
  const { data: appointment, error: aptError } = await admin
    .from("appointments")
    .select("id, salon_id, customer_id, appointment_date, start_time, status, menu_name_snapshot")
    .eq("cancel_token", token)
    .single();

  if (aptError || !appointment) {
    return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  }

  if (appointment.status !== "scheduled") {
    return NextResponse.json({ error: "この予約は変更できません" }, { status: 400 });
  }

  // 締切チェック
  const deadlineError = await checkChangeDeadline(admin, appointment.salon_id, appointment.appointment_date, appointment.start_time);
  if (deadlineError) {
    return NextResponse.json({ error: deadlineError }, { status: 400 });
  }

  // サロン情報取得
  const { data: salon } = await admin
    .from("salons")
    .select("id, name, phone, owner_id, booking_enabled, business_hours, salon_holidays, hour_overrides, booking_settings")
    .eq("id", appointment.salon_id)
    .single<{
      id: string; name: string; phone: string | null; owner_id: string; booking_enabled: boolean;
      business_hours: BusinessHours | null; salon_holidays: string[] | null;
      hour_overrides: HourOverrides | null; booking_settings: BookingSettings | null;
    }>();

  if (!salon || !salon.booking_enabled) {
    return NextResponse.json({ error: "予約の変更を受け付けていません" }, { status: 403 });
  }

  // メニュー存在確認
  const { data: menus } = await admin
    .from("treatment_menus")
    .select("id, name, price, duration_minutes")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .in("id", menu_ids);

  if (!menus || menus.length !== menu_ids.length) {
    return NextResponse.json({ error: "選択されたメニューが見つかりません" }, { status: 400 });
  }

  // end_time 計算
  const totalDuration = menus.reduce((sum, m) => sum + (m.duration_minutes ?? 60), 0);
  const startMin = timeToMinutes(start_time);
  const endMin = startMin + totalDuration;
  const end_time = minutesToTime(endMin);

  // 空き枠チェック（自分自身の予約は除外）
  const { data: existingApts } = await admin
    .from("appointments")
    .select("id, start_time, end_time")
    .eq("salon_id", salon.id)
    .eq("appointment_date", date)
    .neq("status", "cancelled");

  const filteredApts = (existingApts ?? [])
    .filter((a) => a.id !== appointment.id)
    .map(({ start_time, end_time }) => ({ start_time, end_time }));

  const slots = calculateAvailableSlots({
    businessHours: salon.business_hours,
    salonHolidays: salon.salon_holidays,
    hourOverrides: salon.hour_overrides,
    bookingSettings: salon.booking_settings,
    date,
    existingAppointments: filteredApts,
    requestedDuration: totalDuration,
  });

  const targetSlot = slots.find((s) => s.time === start_time);
  if (!targetSlot || !targetSlot.available) {
    return NextResponse.json({ error: "この時間帯は予約できません。別の時間をお選びください" }, { status: 409 });
  }

  // 変更前の情報を保持（通知用）
  const oldDate = appointment.appointment_date;
  const oldTime = appointment.start_time;
  const oldMenuName = appointment.menu_name_snapshot;

  // 予約を更新
  const menuNameSnapshot = menus.map((m) => m.name).join("、");
  const { error: updateError } = await admin
    .from("appointments")
    .update({
      appointment_date: date,
      start_time: start_time + ":00",
      end_time: end_time + ":00",
      menu_id: menus[0].id,
      menu_name_snapshot: menuNameSnapshot,
    })
    .eq("id", appointment.id)
    .eq("salon_id", salon.id);

  if (updateError) {
    console.error("予約変更エラー:", updateError);
    return NextResponse.json({ error: `予約の変更に失敗しました: ${updateError.message}` }, { status: 500 });
  }

  // appointment_menus を差し替え
  await admin.from("appointment_menus").delete().eq("appointment_id", appointment.id);
  const menuRows = menus.map((m, i) => ({
    appointment_id: appointment.id,
    menu_id: m.id,
    menu_name_snapshot: m.name,
    price_snapshot: m.price,
    duration_minutes_snapshot: m.duration_minutes,
    sort_order: i,
  }));
  await admin.from("appointment_menus").insert(menuRows);

  // 通知（fire-and-forget）
  sendChangeNotifications({
    salonId: salon.id,
    salonName: salon.name,
    salonPhone: salon.phone,
    ownerId: salon.owner_id,
    customerId: appointment.customer_id,
    oldDate,
    oldTime,
    oldMenuName,
    newDate: date,
    newTime: start_time + ":00",
    newMenuNames: menus.map((m) => m.name),
    newTotalDuration: totalDuration,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}

// 変更通知メール送信
async function sendChangeNotifications(params: {
  salonId: string;
  salonName: string;
  salonPhone: string | null;
  ownerId: string;
  customerId: string;
  oldDate: string;
  oldTime: string;
  oldMenuName: string | null;
  newDate: string;
  newTime: string;
  newMenuNames: string[];
  newTotalDuration: number;
}): Promise<void> {
  const admin = createAdminClient();

  const { data: customer } = await admin
    .from("customers")
    .select("last_name, first_name, email")
    .eq("id", params.customerId)
    .eq("salon_id", params.salonId)
    .single();

  if (!customer) return;
  const customerName = `${customer.last_name} ${customer.first_name}`;

  const results = await Promise.allSettled([
    // 顧客へ変更確認メール
    (async () => {
      if (!customer.email) return;
      const resend = getResendClient();
      if (!resend) return;

      const { subject, html } = buildCustomerChangeConfirmationEmail({
        customerName,
        oldDate: params.oldDate,
        oldTime: params.oldTime,
        newDate: params.newDate,
        newTime: params.newTime,
        newMenuNames: params.newMenuNames,
        newTotalDuration: params.newTotalDuration,
        salonName: params.salonName,
        salonPhone: params.salonPhone,
      });

      const { error } = await resend.emails.send({
        from: getFromAddress(),
        to: customer.email,
        subject,
        html,
      });
      if (error) throw new Error(`変更確認メール送信失敗: ${error.message}`);
    })(),

    // オーナーへ変更通知メール
    (async () => {
      const resend = getResendClient();
      if (!resend) return;

      const { data: { user } } = await admin.auth.admin.getUserById(params.ownerId);
      if (!user?.email) return;

      const { subject, html } = buildOwnerChangeNotificationEmail({
        customerName,
        oldDate: params.oldDate,
        oldTime: params.oldTime,
        oldMenuName: params.oldMenuName,
        newDate: params.newDate,
        newTime: params.newTime,
        newMenuNames: params.newMenuNames,
        salonName: params.salonName,
      });

      const { error } = await resend.emails.send({
        from: getFromAddress(),
        to: user.email,
        subject,
        html,
      });
      if (error) throw new Error(`オーナー変更通知メール送信失敗: ${error.message}`);
    })(),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("変更通知エラー:", result.reason);
      Sentry.captureException(result.reason, {
        tags: { feature: "booking-change-notification" },
      });
    }
  }
}
