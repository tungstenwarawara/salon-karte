"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * ルートレイアウトのクラッシュをキャッチするグローバルエラーバウンダリ
 * global-error.tsx は自前の <html> <body> をレンダリングする必要がある
 */
export default function GlobalError({
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
    <html lang="ja">
      <body className="antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md space-y-4">
            <h2 className="text-xl font-bold text-[#3D3D3D]">
              予期しないエラーが発生しました
            </h2>
            <p className="text-[#6B6B6B] text-sm">
              ご不便をおかけして申し訳ございません。
              <br />
              問題が解消しない場合はサポートまでご連絡ください。
            </p>
            <button
              onClick={() => reset()}
              className="bg-[#C4956A] hover:opacity-90 text-white font-medium rounded-xl px-6 py-3 min-h-[48px] transition-opacity"
            >
              もう一度試す
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
