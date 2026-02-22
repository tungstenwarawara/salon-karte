import { NextResponse } from "next/server";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { decrypt } from "@/lib/line/crypto";
import { sendPushMessage } from "@/lib/line/api";
import { buildConfirmationMessage } from "@/lib/line/messages";

// POST: 予約確認通知をLINEで送信
export async function POST(request: Request) {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const body = await request.json();
  const { appointment_id } = body as { appointment_id: string };

  if (!appointment_id) {
    return NextResponse.json({ error: "予約IDが必要です" }, { status: 400 });
  }

  // LINE設定を確認
  const { data: config } = await supabase
    .from("salon_line_configs")
    .select("id, channel_access_token_encrypted, is_active, confirmation_enabled")
    .eq("salon_id", salon.id)
    .single();

  if (!config || !config.is_active || !config.confirmation_enabled) {
    return NextResponse.json({ skipped: true });
  }

  // 予約情報を取得
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, customer_id, appointment_date, start_time")
    .eq("id", appointment_id)
    .eq("salon_id", salon.id)
    .single();

  if (!appointment) {
    return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  }

  // 予約メニュー名を取得
  const { data: appointmentMenus } = await supabase
    .from("appointment_menus")
    .select("menu_name_snapshot")
    .eq("appointment_id", appointment_id)
    .order("sort_order", { ascending: true });

  const menuNames = (appointmentMenus ?? []).map((m) => m.menu_name_snapshot);

  // 顧客名を取得
  const { data: customer } = await supabase
    .from("customers")
    .select("last_name, first_name")
    .eq("id", appointment.customer_id)
    .eq("salon_id", salon.id)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "顧客が見つかりません" }, { status: 404 });
  }

  // LINE紐付けを確認
  const { data: lineLink } = await supabase
    .from("customer_line_links")
    .select("id, line_user_id, is_following")
    .eq("customer_id", appointment.customer_id)
    .eq("salon_id", salon.id)
    .single();

  if (!lineLink || !lineLink.is_following) {
    return NextResponse.json({ skipped: true, reason: "LINE未紐付けまたはブロック中" });
  }

  // メッセージ送信
  const accessToken = decrypt(config.channel_access_token_encrypted);
  const message = buildConfirmationMessage({
    customerName: `${customer.last_name}${customer.first_name}`,
    appointmentDate: appointment.appointment_date,
    startTime: appointment.start_time,
    menuNames,
    salonName: salon.name,
  });

  try {
    await sendPushMessage(accessToken, lineLink.line_user_id, [message]);

    await supabase.from("line_message_logs").insert({
      salon_id: salon.id,
      customer_line_link_id: lineLink.id,
      message_type: "confirmation",
      status: "sent",
      related_appointment_id: appointment_id,
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "送信に失敗しました";
    console.error("LINE予約確認通知エラー:", errorMessage);

    await supabase.from("line_message_logs").insert({
      salon_id: salon.id,
      customer_line_link_id: lineLink.id,
      message_type: "confirmation",
      status: "failed",
      error_message: errorMessage,
      related_appointment_id: appointment_id,
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
