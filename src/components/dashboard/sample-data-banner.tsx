"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setFlashToast } from "@/components/ui/toast";

export function SampleDataBanner() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!confirm("サンプルデータを削除します。よろしいですか？")) return;
    setError("");
    setDeleting(true);

    try {
      const res = await fetch("/api/setup/seed-sample", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "削除に失敗しました");
      }
      setFlashToast("サンプルデータを削除しました");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-yellow-900">サンプルデータが表示されています</p>
          <p className="text-xs text-yellow-800 mt-0.5">
            「サンプル」と名前のついた顧客・メニュー・予約・カルテはお試し用のデータです。実際の利用を始める前に削除できます。
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-xl px-3 py-2 min-h-[44px] shrink-0 disabled:opacity-50 transition-colors"
        >
          {deleting ? "削除中..." : "一括削除"}
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
