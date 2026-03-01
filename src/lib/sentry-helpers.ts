/**
 * Sentry ヘルパー関数
 * エラー報告ユーティリティ
 *
 * 注意: PII除去（scrubPii）は sentry.*.config.ts にインライン定義。
 * ルートの config ファイルから @/ パスエイリアスが解決できないため。
 */
import * as Sentry from "@sentry/nextjs";

/** Supabase 操作エラーをキャプチャ */
export function captureSupabaseError(
  operation: string,
  error: { message: string; code?: string; details?: string },
  context?: Record<string, unknown>,
) {
  Sentry.captureException(new Error(`Supabase ${operation}: ${error.message}`), {
    tags: {
      supabase_operation: operation,
      ...(error.code && { supabase_error_code: error.code }),
    },
    extra: {
      ...context,
      error_details: error.details,
    },
  });
}

/** 業務エラーをキャプチャ（例外ではないが記録したいエラー） */
export function captureBusinessError(
  message: string,
  options: {
    level: "warning" | "error";
    feature: string;
    extra?: Record<string, unknown>;
  },
) {
  Sentry.captureMessage(message, {
    level: options.level,
    tags: { feature: options.feature },
    extra: options.extra,
  });
}
