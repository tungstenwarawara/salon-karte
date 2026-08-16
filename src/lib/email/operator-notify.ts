import { after } from "next/server";
import { getResendClient, getFromAddress } from "./client";
import { buildOperatorBillingEmail, type OperatorBillingEvent } from "./templates";

/**
 * 運営者（サービス提供側）へ課金イベントを通知する。
 *
 * 設計上の制約:
 * - **絶対に throw しない**。通知の失敗で Webhook を失敗扱いにすると Stripe が再送し、
 *   同じ通知が何通も飛ぶ（かつ課金処理自体は成功済みなので再送に意味がない）
 * - `after()` で包む。レスポンス返却後に await されない Promise は Vercel で
 *   中断されるため（2026-08-14 の予約メール障害と同じ原因）
 * - `OPERATOR_NOTIFICATION_EMAIL` 未設定なら何もしない（graceful degradation）
 *
 * 呼び出しは DB 更新がすべて成功した後に行うこと。
 * 途中で呼ぶと、後続が失敗して再送されたときに通知が重複する。
 */
export function notifyOperatorBillingEvent(info: OperatorBillingEvent): void {
  after(async () => {
    try {
      const to = process.env.OPERATOR_NOTIFICATION_EMAIL;
      if (!to) return;

      const resend = getResendClient();
      if (!resend) return;

      const { subject, html } = buildOperatorBillingEmail(info);
      const { error } = await resend.emails.send({
        from: getFromAddress(),
        to,
        subject,
        html,
      });

      if (error) {
        console.error("運営者通知メールの送信に失敗:", error);
      }
    } catch (err) {
      console.error("運営者通知メールの送信に失敗:", err);
    }
  });
}
