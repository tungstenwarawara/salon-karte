"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setFlashToast } from "@/components/ui/toast";

export function SampleDataBanner() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    setDeleting(true);

    try {
      const res = await fetch("/api/setup/seed-sample", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "削除に失敗しました");
      }
      setFlashToast("サンプルを削除しました");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">お試し用のサンプルが入っています</p>
          <p className="text-xs text-text-light mt-0.5">
            「サンプル」と名前のついたお客様・メニュー・予約・カルテは使い方を試すためのものです。実際にお客様を登録するときに削除できます。
          </p>
          {!confirming && (
            <p className="text-xs text-accent mt-2">
              まずは下の「今日の予約」や顧客一覧を見て、使い方を試してみましょう。
            </p>
          )}
        </div>
        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="bg-surface border border-border hover:bg-background text-text text-xs font-medium rounded-xl px-3 py-2 min-h-[44px] shrink-0 transition-colors"
          >
            サンプルを全部消す
          </button>
        )}
      </div>

      {confirming && (
        <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
          <p className="text-sm font-medium">本当にサンプルを全部消しますか？</p>
          <p className="text-xs text-text-light">
            サンプルのお客様・メニュー・予約・カルテがすべて削除されます。あなたが自分で追加したデータは残ります。
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="flex-1 bg-background border border-border text-text text-sm font-medium rounded-xl py-2.5 min-h-[44px] disabled:opacity-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-error hover:bg-error/90 text-white text-sm font-medium rounded-xl py-2.5 min-h-[44px] disabled:opacity-50 transition-colors"
            >
              {deleting ? "削除中..." : "全部消す"}
            </button>
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
