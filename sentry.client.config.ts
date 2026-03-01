/**
 * Sentry クライアント（ブラウザ）設定
 * セッションリプレイは無効（全画面に顧客PII表示のため）
 *
 * 注意: このファイルはプロジェクトルートにあるため @/ パスエイリアスが
 * 使えない。PII除去ロジックはインラインで定義する。
 */
import * as Sentry from "@sentry/nextjs";

// PII フィールド — エラーイベントから自動除去
const PII_KEYS = new Set([
  "last_name", "first_name", "last_name_kana", "first_name_kana",
  "phone", "email", "address", "birth_date",
  "allergies", "treatment_goal", "height_cm", "weight_kg",
  "marital_status", "has_children", "skin_condition_before", "skin_condition_after",
  "line_user_id", "channel_access_token_encrypted", "channel_secret_encrypted", "webhook_secret",
]);

function scrubPii(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.breadcrumbs) {
    for (const breadcrumb of event.breadcrumbs) {
      if (breadcrumb.data) {
        for (const key of Object.keys(breadcrumb.data)) {
          if (PII_KEYS.has(key)) breadcrumb.data[key] = "[REDACTED]";
        }
      }
    }
  }
  if (event.extra) {
    for (const key of Object.keys(event.extra)) {
      if (PII_KEYS.has(key)) event.extra[key] = "[REDACTED]";
    }
  }
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }
  return event;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // 開発環境ではエラー送信しない（Sentry Issues のノイズ防止）
  enabled: process.env.NODE_ENV === "production",

  // パフォーマンス: 10%サンプリング（小規模SaaSには十分）
  tracesSampleRate: 0.1,

  // セッションリプレイ: 完全無効（PII対策）
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // PII除去
  beforeSend: scrubPii,

  // よくある非アクション可能エラーを除外
  ignoreErrors: [
    "ResizeObserver loop",
    "Network request failed",
    "AbortError",
    "ChunkLoadError",
    "Failed to fetch",
  ],
});
