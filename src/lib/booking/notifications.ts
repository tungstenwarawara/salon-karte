import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress } from "@/lib/email/client";
import {
  buildCustomerConfirmationEmail,
  buildOwnerNotificationEmail,
} from "@/lib/email/templates";
import { decrypt } from "@/lib/line/crypto";
import { sendPushMessage } from "@/lib/line/api";
import { buildConfirmationMessage } from "@/lib/line/messages";

type WebBookingNotificationParams = {
  salonId: string;
  salonName: string;
  salonPhone: string | null;
  ownerId: string;
  appointmentId: string;
  appointmentDate: string;
  startTime: string;
  menuNames: string[];
  totalDuration: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  isNewCustomer: boolean;
  memo?: string | null;
  cancelUrl?: string;
};

// Web予約完了後の通知を一括送信（fire-and-forget）
// 1. 顧客への確認メール
// 2. オーナーへの新規予約通知メール
// 3. LINE通知（紐付け済みの場合のみ）
export async function sendWebBookingNotifications(
  params: WebBookingNotificationParams
): Promise<void> {
  const results = await Promise.allSettled([
    sendCustomerEmail(params),
    sendOwnerEmail(params),
    sendLineNotification(params),
  ]);

  // エラーをログに記録（通知失敗は予約の成否に影響しない）
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Web予約通知エラー:", result.reason);
      Sentry.captureException(result.reason, {
        tags: { feature: "web-booking-notification" },
      });
    }
  }
}

// 顧客への予約確認メール
async function sendCustomerEmail(
  params: WebBookingNotificationParams
): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  const { subject, html } = buildCustomerConfirmationEmail({
    customerName: params.customerName,
    appointmentDate: params.appointmentDate,
    startTime: params.startTime,
    menuNames: params.menuNames,
    totalDuration: params.totalDuration,
    salonName: params.salonName,
    salonPhone: params.salonPhone,
    cancelUrl: params.cancelUrl,
  });

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: params.customerEmail,
    subject,
    html,
  });

  if (error) {
    throw new Error(`顧客メール送信失敗: ${error.message}`);
  }
}

// オーナーへの新規予約通知メール
async function sendOwnerEmail(
  params: WebBookingNotificationParams
): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  // オーナーのメールアドレスを Supabase Auth から取得
  const admin = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await admin.auth.admin.getUserById(params.ownerId);

  if (userError || !user?.email) {
    console.warn("オーナーメール取得失敗:", userError?.message);
    return;
  }

  const { subject, html } = buildOwnerNotificationEmail({
    customerName: params.customerName,
    isNewCustomer: params.isNewCustomer,
    appointmentDate: params.appointmentDate,
    startTime: params.startTime,
    menuNames: params.menuNames,
    totalDuration: params.totalDuration,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    memo: params.memo,
    salonName: params.salonName,
  });

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: user.email,
    subject,
    html,
  });

  if (error) {
    throw new Error(`オーナーメール送信失敗: ${error.message}`);
  }
}

// LINE通知（紐付け済み顧客のみ）
async function sendLineNotification(
  params: WebBookingNotificationParams
): Promise<void> {
  const admin = createAdminClient();

  // LINE設定を確認
  const { data: config } = await admin
    .from("salon_line_configs")
    .select("id, channel_access_token_encrypted, is_active, confirmation_enabled")
    .eq("salon_id", params.salonId)
    .single();

  if (!config || !config.is_active || !config.confirmation_enabled) return;

  // 顧客のLINE紐付けを確認
  const { data: lineLink } = await admin
    .from("customer_line_links")
    .select("id, line_user_id, is_following")
    .eq("customer_id", params.customerId)
    .eq("salon_id", params.salonId)
    .single();

  if (!lineLink || !lineLink.is_following) return;

  // メッセージ送信
  const accessToken = decrypt(config.channel_access_token_encrypted);
  const message = buildConfirmationMessage({
    customerName: params.customerName,
    appointmentDate: params.appointmentDate,
    startTime: params.startTime,
    menuNames: params.menuNames,
    salonName: params.salonName,
  });

  await sendPushMessage(accessToken, lineLink.line_user_id, [message]);

  // ログ記録
  await admin.from("line_message_logs").insert({
    salon_id: params.salonId,
    customer_line_link_id: lineLink.id,
    message_type: "confirmation" as const,
    status: "sent" as const,
    related_appointment_id: params.appointmentId,
    sent_at: new Date().toISOString(),
  });
}
