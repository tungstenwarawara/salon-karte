import { Resend } from "resend";

// Resend クライアント（サーバーサイドのみ）
// RESEND_API_KEY が未設定の場合は null を返す（メール送信をスキップ）
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY が未設定のためメール送信をスキップします");
    return null;
  }
  return new Resend(apiKey);
}

// 送信元アドレス（環境変数 or デフォルト）
export function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "サロンカルテ <support@salonkarte.com>";
}
