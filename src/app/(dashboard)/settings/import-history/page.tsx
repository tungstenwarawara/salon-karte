"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { Database } from "@/types/database";

type ImportBatch = Database["public"]["Tables"]["import_batches"]["Row"];

const BATCH_TYPE_LABELS: Record<string, string> = {
  customers: "顧客データ",
  products: "商品データ",
  records: "施術履歴",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function ImportHistoryPage() {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [modifiedCount, setModifiedCount] = useState<number | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { user, salonId: sid } = await getClientAuth();
    if (!user || !sid) return;
    setSalonId(sid);

    const supabase = createClient();
    const { data } = await supabase
      .from("import_batches")
      .select("id, salon_id, batch_type, filename, total_count, success_count, failed_count, entity_ids, created_at")
      .eq("salon_id", sid)
      .order("created_at", { ascending: false })
      .limit(50);
    setBatches(data ?? []);
    setLoading(false);
  };

  const handleConfirm = async (batchId: string) => {
    setError("");
    setSuccessMsg("");
    setConfirmId(batchId);
    setModifiedCount(null);
    setCheckingId(batchId);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("check_import_batch_modifications", {
      p_batch_id: batchId,
      p_salon_id: salonId,
    });

    setCheckingId(null);
    if (rpcError) {
      console.error("check_import_batch_modifications error:", rpcError);
      setModifiedCount(0);
      return;
    }

    const result = data?.[0];
    setModifiedCount(result?.modified_count ?? 0);
  };

  const handleUndo = async (batchId: string) => {
    setError("");
    setSuccessMsg("");
    setUndoingId(batchId);
    setConfirmId(null);
    setModifiedCount(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("undo_import_batch", {
      p_batch_id: batchId,
      p_salon_id: salonId,
    });

    if (rpcError) {
      setError(rpcError.message);
      setUndoingId(null);
      return;
    }

    const result = data?.[0];
    const typeLabel = result ? BATCH_TYPE_LABELS[result.batch_type] ?? result.batch_type : "";
    setSuccessMsg(`${typeLabel} ${result?.deleted_count ?? 0}件を取り消しました`);
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    setUndoingId(null);
  };

  const handleCancel = () => {
    setConfirmId(null);
    setModifiedCount(null);
    setCheckingId(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="取り込み履歴"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "データ取り込み", href: "/settings/import" },
          { label: "取り込み履歴" },
        ]}
      />

      {error && <ErrorAlert message={error} />}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-sm text-green-700">{successMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-border rounded w-1/3 mb-2" />
              <div className="h-3 bg-border rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-light text-sm">取り込み履歴はまだありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div key={batch.id} className="bg-surface border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm">
                    {BATCH_TYPE_LABELS[batch.batch_type] ?? batch.batch_type}
                  </p>
                  <p className="text-xs text-text-light mt-0.5">
                    {formatDate(batch.created_at)}
                    {" ・ "}
                    {batch.success_count}件成功
                    {batch.failed_count > 0 && ` / ${batch.failed_count}件失敗`}
                  </p>
                </div>
                {confirmId === batch.id ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleUndo(batch.id)}
                      disabled={undoingId === batch.id || checkingId === batch.id}
                      className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg min-h-[44px] disabled:opacity-50"
                    >
                      {undoingId === batch.id ? "取消中..." : "実行"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-xs text-text-light border border-border px-3 py-1.5 rounded-lg min-h-[44px]"
                    >
                      やめる
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConfirm(batch.id)}
                    disabled={undoingId !== null}
                    className="text-xs text-error px-3 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px] shrink-0 disabled:opacity-50"
                  >
                    取り消し
                  </button>
                )}
              </div>
              {confirmId === batch.id && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs text-red-700">
                    取り込んだ{BATCH_TYPE_LABELS[batch.batch_type]}（{batch.success_count}件）を全て削除します。この操作は元に戻せません。
                  </p>
                  {checkingId === batch.id ? (
                    <p className="text-xs text-red-500">確認中...</p>
                  ) : modifiedCount !== null && modifiedCount > 0 && (
                    <p className="text-xs text-red-700 font-bold">
                      ※ うち{modifiedCount}件は取り込み後に更新されています。更新内容も失われます。
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
