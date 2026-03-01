"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

/**
 * ダッシュボード内ページのクラッシュをキャッチするエラーバウンダリ
 * ヘッダー・ナビゲーションは保持される
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="space-y-5 text-center py-12">
      <h2 className="text-lg font-bold">エラーが発生しました</h2>
      <p className="text-text-light text-sm">
        ページの読み込み中に問題が発生しました。
      </p>
      <div className="space-y-3">
        <button
          onClick={() => reset()}
          className="bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-3 min-h-[48px] transition-colors"
        >
          もう一度試す
        </button>
        <Link href="/dashboard" className="block text-sm text-accent hover:underline">
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
