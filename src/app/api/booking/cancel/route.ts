import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runNotificationsSequentially } from "@/lib/booking/notifications";
import { getResendClient, getFromAddress } from "@/lib/email/client";
import {
  buildCustomerCancelConfirmationEmail,
  buildOwnerCancelNotificationEmail,
} from "@/lib/email/templates";
import { checkChangeDeadline } from "@/lib/booking/deadline";
import { todayStrInJst } from "@/lib/business-hours";

// POST: 予約キャンセル（公開API — cancel_tokenで認証）
export async function POST(request: Request) {
  let body: { token: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { token } = body;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "トークンが不正です" }, { status: 400 });
  }

  const admin = createAdminClient();

  // キャンセルトークンで予約を検索
  const { data: appointment, error: aptError } = await admin
    .from("appointments")
    .select("id, salon_id, customer_id, appointment_date, start_time, status, menu_name_snapshot")
    .eq("cancel_token", token)
    .single();

  if (aptError || !appointment) {
    return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  }

  // すでにキャンセル済み
  if (appointment.status === "cancelled") {
    return NextResponse.json({ error: "この予約はすでにキャンセルされています" }, { status: 400 });
  }

  // 完了済みの予約はキャンセル不可
  if (appointment.status === "completed") {
    return NextResponse.json({ error: "完了した予約はキャンセルできません" }, { status: 400 });
  }

  // 過去の予約はキャンセル不可（JST基準）
  if (appointment.appointment_date < todayStrInJst()) {
    return NextResponse.json({ error: "過去の予約はキャンセルできません" }, { status: 400 });
  }

  // キャンセル・変更締切チェック
  const deadlineError = await checkChangeDeadline(admin, appointment.salon_id, appointment.appointment_date, appointment.start_time);
  if (deadlineError) {
    return NextResponse.json({ error: deadlineError }, { status: 400 });
  }

  // ステータスをキャンセルに更新
  const { error: updateError } = await admin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointment.id)
    .eq("salon_id", appointment.salon_id);

  if (updateError) {
    console.error("予約キャンセルエラー:", updateError);
    return NextResponse.json({ error: "キャンセルに失敗しました" }, { status: 500 });
  }

  // 通知メール送信（after() で包むこと。放置した Promise は関数の凍結で失われる）
  after(async () => {
    await sendCancelNotifications({
      salonId: appointment.salon_id,
      customerId: appointment.customer_id,
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time,
      menuNameSnapshot: appointment.menu_name_snapshot,
    });
  });

  return NextResponse.json({ success: true });
}

// GET: キャンセルトークンで予約情報を取得（キャンセル確認画面用）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "トークンが不正です" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: appointment, error } = await admin
    .from("appointments")
    .select("id, salon_id, appointment_date, start_time, status, menu_name_snapshot")
    .eq("cancel_token", token)
    .single();

  if (error || !appointment) {
    return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  }

  // サロン名を取得
  const { data: salon } = await admin
    .from("salons")
    .select("name, booking_slug")
    .eq("id", appointment.salon_id)
    .single();

  // 締切切れ判定
  let deadlinePassed = false;
  if (appointment.status === "scheduled") {
    const err = await checkChangeDeadline(admin, appointment.salon_id, appointment.appointment_date, appointment.start_time);
    deadlinePassed = !!err;
  }

  return NextResponse.json({
    appointmentDate: appointment.appointment_date,
    startTime: appointment.start_time,
    status: appointment.status,
    menuName: appointment.menu_name_snapshot,
    salonName: salon?.name ?? "",
    bookingSlug: salon?.booking_slug ?? null,
    deadlinePassed,
  });
}

// キャンセル通知メール送信
async function sendCancelNotifications(params: {
  salonId: string;
  customerId: string;
  appointmentDate: string;
  startTime: string;
  menuNameSnapshot: string | null;
}): Promise<void> {
  const admin = createAdminClient();

  // 顧客情報取得
  const { data: customer } = await admin
    .from("customers")
    .select("last_name, first_name, email")
    .eq("id", params.customerId)
    .eq("salon_id", params.salonId)
    .single();

  if (!customer) return;

  // サロン情報取得
  const { data: salon } = await admin
    .from("salons")
    .select("name, phone, owner_id, booking_slug")
    .eq("id", params.salonId)
    .single();

  if (!salon) return;

  // メニュー名の取得（appointment_menusから）
  const menuNames = params.menuNameSnapshot
    ? params.menuNameSnapshot.split("、")
    : [];

  const customerName = `${customer.last_name} ${customer.first_name}`;

  // 顧客向けを先頭に、1件ずつ送る（Resend のレート制限で消えるのを防ぐ）
  await runNotificationsSequentially("booking-cancel-notification", [
    {
      name: "customer-email",
      run: async () => {
        if (!customer.email) return;
        const resend = getResendClient();
        if (!resend) return;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://salonkarte.com";
        const bookingUrl = salon.booking_slug ? `${baseUrl}/book/${salon.booking_slug}` : undefined;

        const { subject, html } = buildCustomerCancelConfirmationEmail({
          customerName,
          appointmentDate: params.appointmentDate,
          startTime: params.startTime,
          menuNames,
          salonName: salon.name,
          salonPhone: salon.phone,
          bookingUrl,
        });

        const { error } = await resend.emails.send({
          from: getFromAddress(),
          to: customer.email,
          subject,
          html,
        });
        if (error) throw new Error(`キャンセル確認メール送信失敗: ${error.message}`);
      },
    },
    {
      name: "owner-email",
      run: async () => {
        const resend = getResendClient();
        if (!resend) return;

        const { data: { user } } = await admin.auth.admin.getUserById(salon.owner_id);
        if (!user?.email) return;

        const { subject, html } = buildOwnerCancelNotificationEmail({
          customerName,
          appointmentDate: params.appointmentDate,
          startTime: params.startTime,
          menuNames,
          salonName: salon.name,
        });

        const { error } = await resend.emails.send({
          from: getFromAddress(),
          to: user.email,
          subject,
          html,
        });
        if (error) throw new Error(`オーナーキャンセル通知メール送信失敗: ${error.message}`);
      },
    },
  ]);
}
