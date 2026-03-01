/**
 * Next.js Instrumentation Hook
 * Sentry のサーバー/Edge 設定をランタイムに応じて読み込み
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Server Component / API Route / Server Action の未ハンドルエラーを自動送信
export const onRequestError = Sentry.captureRequestError;
