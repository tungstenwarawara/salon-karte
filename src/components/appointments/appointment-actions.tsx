"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ErrorAlert } from "@/components/ui/error-alert";

type Props = {
  appointmentId: string;
  salonId: string;
  status: string;
  customerId: string;
  treatmentRecordId: string | null;
  hasKarte: boolean;
};

/** 予約詳細ページのアクションボタン群（Client Component） */
export function AppointmentActions({ appointmentId, salonId, status, customerId, treatmentRecordId, hasKarte }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: e } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId)
      .eq("salon_id", salonId);
    if (e) {
      setError(`ステータスの更新に失敗しました: ${e.message}`);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: e } = await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentId)
      .eq("salon_id", salonId);
    if (e) {
      setError(`予約の削除に失敗しました: ${e.message}`);
      setLoading(false);
      return;
    }
    router.push("/appointments");
  };

  return (
    <div className="space-y-3 pt-2">
      {error && <ErrorAlert message={error} />}

      {/* カルテ作成 / カルテを見る */}
      {(status === "scheduled" || (status === "completed" && !hasKarte)) && (
        <Link
          href={`/records/new?customer=${customerId}&appointment=${appointmentId}`}
          className="block w-full text-center bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors min-h-[48px]"
        >
          カルテを作成
        </Link>
      )}
      {status === "completed" && hasKarte && treatmentRecordId && (
        <Link
          href={`/records/${treatmentRecordId}`}
          className="block w-full text-center bg-accent/10 text-accent font-medium rounded-xl py-3 transition-colors min-h-[48px] hover:bg-accent/20"
        >
          カルテを見る
        </Link>
      )}

      {/* ステータス変更 */}
      {status === "scheduled" && (
        <div className="flex items-center justify-center gap-6 pt-1">
          <button
            onClick={() => updateStatus("completed")}
            disabled={loading}
            className="text-sm text-text-light hover:text-accent transition-colors min-h-[44px] disabled:opacity-50"
          >
            来店のみ記録
            <span className="block text-[10px] text-text-light">カルテは後から作成できます</span>
          </button>
          <span className="text-border">|</span>
          <button
            onClick={() => updateStatus("cancelled")}
            disabled={loading}
            className="text-sm text-text-light hover:text-error transition-colors min-h-[44px] disabled:opacity-50"
          >
            予約をキャンセル
          </button>
        </div>
      )}

      {/* 削除 */}
      {!hasKarte && (
        <div className="pt-4 border-t border-border">
          {confirmDelete ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
              <p className="text-sm text-red-700">この予約を削除しますか？</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-sm bg-error text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors min-h-[44px] disabled:opacity-50"
                >
                  {loading ? "削除中..." : "削除する"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm text-text-light px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-error hover:underline min-h-[44px]"
            >
              この予約を削除
            </button>
          )}
        </div>
      )}
    </div>
  );
}
