import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/line/crypto";
import { sendPushMessage } from "@/lib/line/api";
import { buildReminderMessage } from "@/lib/line/messages";
import { getResendClient, getFromAddress } from "@/lib/email/client";
import { buildCustomerReminderEmail } from "@/lib/email/templates";

// GET: 前日リマインド（Vercel Cron Job: 毎日 12:00 UTC = 21:00 JST）
// LINE + メール の両チャネルで送信
// Vercel Cron は GET で呼び出す仕様。POST にすると 405 で空振りし続けるので注意
export async function GET(request: Request) {
  // CRON_SECRET検証（未設定時はリクエストを拒否）
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET が設定されていません");
    Sentry.captureMessage("CRON_SECRET が設定されていません", { level: "error", tags: { feature: "cron" } });
    return NextResponse.json({ error: "サーバー設定エラー" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("Cron認証失敗: Authorizationヘッダー不一致");
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // 明日の日付（JST）
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const tomorrow = new Date(jstNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  // 全サロンの明日の予約を取得（scheduled のみ）
  const { data: appointments } = await adminClient
    .from("appointments")
    .select("id, salon_id, customer_id, appointment_date, start_time, staff_id, cancel_token")
    .eq("appointment_date", tomorrowStr)
    .eq("status", "scheduled");

  if (!appointments || appointments.length === 0) {
    return NextResponse.json({ line: { sent: 0, failed: 0 }, email: { sent: 0, failed: 0 }, date: tomorrowStr });
  }

  // サロンIDリストを取得してサロン情報を一括取得
  const salonIds = [...new Set(appointments.map((a) => a.salon_id))];
  const { data: salons } = await adminClient
    .from("salons")
    .select("id, name, phone, booking_slug")
    .in("id", salonIds);

  const salonMap = new Map((salons ?? []).map((s) => [s.id, s]));

  // LINE設定を一括取得
  const { data: lineConfigs } = await adminClient
    .from("salon_line_configs")
    .select("salon_id, channel_access_token_encrypted, is_active, reminder_enabled")
    .in("salon_id", salonIds);

  const lineConfigMap = new Map((lineConfigs ?? []).map((c) => [c.salon_id, c]));

  const stats = { line: { sent: 0, failed: 0 }, email: { sent: 0, failed: 0 } };

  for (const apt of appointments) {
    const salon = salonMap.get(apt.salon_id);
    if (!salon) continue;

    // 顧客情報を取得
    const { data: customer } = await adminClient
      .from("customers")
      .select("last_name, first_name, email")
      .eq("id", apt.customer_id)
      .eq("salon_id", apt.salon_id)
      .single();

    if (!customer) continue;

    const customerName = `${customer.last_name}${customer.first_name}`;

    // メニュー名を取得
    const { data: menus } = await adminClient
      .from("appointment_menus")
      .select("menu_name_snapshot")
      .eq("appointment_id", apt.id)
      .order("sort_order", { ascending: true });

    const menuNames = (menus ?? []).map((m) => m.menu_name_snapshot);

    // --- LINE リマインド ---
    const lineConfig = lineConfigMap.get(apt.salon_id);
    if (lineConfig?.is_active && lineConfig?.reminder_enabled) {
      const { data: lineLink } = await adminClient
        .from("customer_line_links")
        .select("id, line_user_id, is_following")
        .eq("customer_id", apt.customer_id)
        .eq("salon_id", apt.salon_id)
        .single();

      if (lineLink?.is_following) {
        // スタッフ名を取得
        let staffName: string | null = null;
        if (apt.staff_id) {
          const { data: staffData } = await adminClient
            .from("staff")
            .select("name")
            .eq("id", apt.staff_id)
            .eq("salon_id", apt.salon_id)
            .single();
          staffName = staffData?.name ?? null;
        }

        const message = buildReminderMessage({
          customerName,
          appointmentDate: apt.appointment_date,
          startTime: apt.start_time,
          menuNames,
          salonName: salon.name,
          staffName,
        });

        try {
          const accessToken = decrypt(lineConfig.channel_access_token_encrypted);
          await sendPushMessage(accessToken, lineLink.line_user_id, [message]);

          await adminClient.from("line_message_logs").insert({
            salon_id: apt.salon_id,
            customer_line_link_id: lineLink.id,
            message_type: "reminder",
            status: "sent",
            related_appointment_id: apt.id,
            sent_at: new Date().toISOString(),
          });
          stats.line.sent++;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "送信失敗";
          console.error(`LINE リマインド送信エラー (salon: ${apt.salon_id}):`, errorMessage);
          Sentry.captureException(err, { tags: { feature: "line-reminder" }, extra: { salon_id: apt.salon_id } });

          await adminClient.from("line_message_logs").insert({
            salon_id: apt.salon_id,
            customer_line_link_id: lineLink.id,
            message_type: "reminder",
            status: "failed",
            error_message: errorMessage,
            related_appointment_id: apt.id,
          });
          stats.line.failed++;
        }
      }
    }

    // --- メール リマインド ---
    if (customer.email) {
      const resend = getResendClient();
      if (resend) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://salonkarte.com";
        const cancelUrl = apt.cancel_token ? `${baseUrl}/book/cancel/${apt.cancel_token}` : undefined;
        const changeUrl = apt.cancel_token ? `${baseUrl}/book/change/${apt.cancel_token}` : undefined;

        const { subject, html } = buildCustomerReminderEmail({
          customerName,
          appointmentDate: apt.appointment_date,
          startTime: apt.start_time,
          menuNames,
          salonName: salon.name,
          salonPhone: salon.phone,
          cancelUrl,
          changeUrl,
        });

        try {
          const { error } = await resend.emails.send({
            from: getFromAddress(),
            to: customer.email,
            subject,
            html,
          });
          if (error) throw new Error(error.message);
          stats.email.sent++;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "送信失敗";
          console.error(`メール リマインド送信エラー (salon: ${apt.salon_id}):`, errorMessage);
          Sentry.captureException(err, { tags: { feature: "email-reminder" }, extra: { salon_id: apt.salon_id } });
          stats.email.failed++;
        }
      }
    }
  }

  return NextResponse.json({ ...stats, date: tomorrowStr });
}
