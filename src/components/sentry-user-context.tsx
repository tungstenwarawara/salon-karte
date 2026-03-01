"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Sentry にユーザー・サロンコンテキストを設定するコンポーネント
 * エラー発生時にどのサロンで起きたか特定できる（PII は送信しない）
 */
export function SentryUserContext({ userId, salonId }: { userId: string; salonId: string }) {
  useEffect(() => {
    Sentry.setUser({ id: userId });
    Sentry.setTag("salon_id", salonId);
    return () => {
      Sentry.setUser(null);
    };
  }, [userId, salonId]);

  return null;
}
