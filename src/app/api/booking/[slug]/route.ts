import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateAvailableSlots } from "@/lib/booking-slots";

// GET: サロン情報 + メニュー + 空き枠を返す（公開API — 認証不要）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const durationParam = searchParams.get("duration");
  const requestedDuration = durationParam ? parseInt(durationParam, 10) : 0;

  // 日付バリデーション
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  let date = dateParam || todayStr;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日付の形式が不正です" }, { status: 400 });
  }
  // 過去の日付は今日に補正
  if (date < todayStr) date = todayStr;
  // 60日先まで制限
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, "0")}-${String(maxDate.getDate()).padStart(2, "0")}`;
  if (date > maxDateStr) {
    return NextResponse.json({ error: "60日先までしか予約できません" }, { status: 400 });
  }

  const admin = createAdminClient();

  // サロン情報取得
  const { data: salon, error: salonError } = await admin
    .from("salons")
    .select("id, name, booking_slug, booking_enabled, business_hours, salon_holidays, booking_settings")
    .eq("booking_slug", slug)
    .eq("booking_enabled", true)
    .single();

  if (salonError || !salon) {
    return NextResponse.json({ error: "予約ページが見つかりません" }, { status: 404 });
  }

  // アクティブなメニュー取得
  const { data: menus } = await admin
    .from("treatment_menus")
    .select("id, name, price, duration_minutes")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  // 指定日の既存予約取得（キャンセル除く、個人情報は含めない）
  const { data: appointments } = await admin
    .from("appointments")
    .select("start_time, end_time")
    .eq("salon_id", salon.id)
    .eq("appointment_date", date)
    .neq("status", "cancelled");

  // 空き枠計算
  const slots = calculateAvailableSlots({
    businessHours: salon.business_hours,
    salonHolidays: salon.salon_holidays,
    bookingSettings: salon.booking_settings,
    date,
    existingAppointments: appointments ?? [],
    requestedDuration: requestedDuration > 0 ? requestedDuration : undefined,
  });

  return NextResponse.json({
    salon: { name: salon.name, slug: salon.booking_slug },
    menus: menus ?? [],
    date,
    slots,
    businessHours: salon.business_hours,
    bookingSettings: salon.booking_settings,
    salonHolidays: salon.salon_holidays,
  });
}
