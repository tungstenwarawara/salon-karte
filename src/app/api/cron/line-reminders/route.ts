import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/line/crypto";
import { sendPushMessage } from "@/lib/line/api";
import { buildReminderMessage } from "@/lib/line/messages";

// POST: 前日リマインド（Vercel Cron Job: 毎日 12:00 UTC = 21:00 JST）
export async function POST(request: Request) {
  // CRON_SECRET検証
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // 明日の日付（JST）
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const tomorrow = new Date(jstNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  // リマインドが有効なサロンを取得
  const { data: configs } = await adminClient
    .from("salon_line_configs")
    .select("salon_id, channel_access_token_encrypted")
    .eq("is_active", true)
    .eq("reminder_enabled", true);

  if (!configs || configs.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: "対象サロンなし" });
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (const config of configs) {
    // サロン名を取得
    const { data: salon } = await adminClient
      .from("salons")
      .select("name")
      .eq("id", config.salon_id)
      .single();

    if (!salon) continue;

    // 明日の予約を取得（scheduled のみ）
    const { data: appointments } = await adminClient
      .from("appointments")
      .select("id, customer_id, appointment_date, start_time")
      .eq("salon_id", config.salon_id)
      .eq("appointment_date", tomorrowStr)
      .eq("status", "scheduled");

    if (!appointments || appointments.length === 0) continue;

    const accessToken = decrypt(config.channel_access_token_encrypted);

    for (const apt of appointments) {
      // 顧客名を取得
      const { data: customer } = await adminClient
        .from("customers")
        .select("last_name, first_name")
        .eq("id", apt.customer_id)
        .eq("salon_id", config.salon_id)
        .single();

      if (!customer) continue;

      // LINE紐付けを確認
      const { data: lineLink } = await adminClient
        .from("customer_line_links")
        .select("id, line_user_id, is_following")
        .eq("customer_id", apt.customer_id)
        .eq("salon_id", config.salon_id)
        .single();

      if (!lineLink || !lineLink.is_following) continue;

      // メニュー名を取得
      const { data: menus } = await adminClient
        .from("appointment_menus")
        .select("menu_name_snapshot")
        .eq("appointment_id", apt.id)
        .order("sort_order", { ascending: true });

      const menuNames = (menus ?? []).map((m) => m.menu_name_snapshot);

      const message = buildReminderMessage({
        customerName: `${customer.last_name}${customer.first_name}`,
        appointmentDate: apt.appointment_date,
        startTime: apt.start_time,
        menuNames,
        salonName: salon.name,
      });

      try {
        await sendPushMessage(accessToken, lineLink.line_user_id, [message]);

        await adminClient.from("line_message_logs").insert({
          salon_id: config.salon_id,
          customer_line_link_id: lineLink.id,
          message_type: "reminder",
          status: "sent",
          related_appointment_id: apt.id,
          sent_at: new Date().toISOString(),
        });

        totalSent++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "送信失敗";
        console.error(`LINE リマインド送信エラー (salon: ${config.salon_id}):`, errorMessage);

        await adminClient.from("line_message_logs").insert({
          salon_id: config.salon_id,
          customer_line_link_id: lineLink.id,
          message_type: "reminder",
          status: "failed",
          error_message: errorMessage,
          related_appointment_id: apt.id,
        });

        totalFailed++;
      }
    }
  }

  return NextResponse.json({ sent: totalSent, failed: totalFailed, date: tomorrowStr });
}
