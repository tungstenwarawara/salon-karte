"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CancellationDialog, type CancellationSubmitData, type CancellationDialogTicket } from "./cancellation-dialog";

type Props = {
  appointmentId: string;
  salonId: string;
  status: string;
  customerId: string;
  customerName: string;
  appointmentDate: string;
  treatmentRecordId: string | null;
  hasKarte: boolean;
  cancelledRecordId: string | null;
  courseTickets: CancellationDialogTicket[];
};

/** 予約詳細ページのアクションボタン群（Client Component） */
export function AppointmentActions({ appointmentId, salonId, status, customerId, customerName, appointmentDate, treatmentRecordId, hasKarte, cancelledRecordId, courseTickets }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  /** 「来店のみ記録」「キャンセル取消」用の単純なステータス変更 */
  const simpleStatusChange = async (newStatus: string) => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: e } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId)
      .eq("salon_id", salonId);
    if (e) { setError(`ステータスの更新に失敗しました: ${e.message}`); setLoading(false); return; }

    // キャンセル取消時に紐づく cancelled レコードを削除
    if (newStatus !== "cancelled" && cancelledRecordId) {
      const { error: delErr } = await supabase
        .from("treatment_records")
        .delete()
        .eq("id", cancelledRecordId)
        .eq("salon_id", salonId);
      if (delErr) console.error("Cancelled record deletion failed:", delErr);
    }

    router.refresh();
    setLoading(false);
  };

  /** ダイアログからのキャンセル確定処理 */
  const handleCancellationSubmit = async (data: CancellationSubmitData) => {
    const supabase = createClient();

    // 1. 予約を cancelled に更新
    const { error: aptErr } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId)
      .eq("salon_id", salonId);
    if (aptErr) throw new Error(`予約の更新に失敗しました: ${aptErr.message}`);

    // 2. treatment_records (cancelled) を作成
    const { data: rec, error: recErr } = await supabase
      .from("treatment_records")
      .insert({
        salon_id: salonId,
        customer_id: customerId,
        treatment_date: appointmentDate,
        record_type: "cancelled",
        appointment_id: appointmentId,
        notes_after: data.reason || null,
      })
      .select("id")
      .single<{ id: string }>();
    if (recErr || !rec) throw new Error(`カルテ記録の作成に失敗しました: ${recErr?.message ?? "unknown"}`);

    // 3. キャンセル料あり → treatment_record_menus に記録
    if (data.fee.enabled) {
      const { error: menuErr } = await supabase.from("treatment_record_menus").insert({
        treatment_record_id: rec.id,
        menu_id: null,
        menu_name_snapshot: "キャンセル料",
        price_snapshot: data.fee.amount,
        duration_minutes_snapshot: null,
        payment_type: data.fee.paymentType,
        ticket_id: data.fee.ticketId,
        sort_order: 0,
      });
      if (menuErr) console.error("Cancellation fee insert failed:", menuErr);

      // 回数券消化
      if (data.fee.paymentType === "ticket" && data.fee.ticketId) {
        const { error: useErr } = await supabase.rpc("use_course_ticket_session", { p_ticket_id: data.fee.ticketId });
        if (useErr) console.error("Ticket consumption failed:", useErr);
      }
    }

    router.refresh();
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
          href={`/records/new?customer=${customerId}&appointment=${appointmentId}&date=${appointmentDate}`}
          className="block w-full text-center bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors min-h-[48px]"
        >
          カルテを登録
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
            onClick={() => simpleStatusChange("completed")}
            disabled={loading}
            className="text-sm text-text-light hover:text-accent transition-colors min-h-[44px] disabled:opacity-50"
          >
            来店のみ記録
            <span className="block text-[10px] text-text-light">カルテは後から作成できます</span>
          </button>
          <span className="text-border">|</span>
          <button
            onClick={() => setShowCancelDialog(true)}
            disabled={loading}
            className="text-sm text-text-light hover:text-error transition-colors min-h-[44px] disabled:opacity-50"
          >
            予約をキャンセル
          </button>
        </div>
      )}

      {status === "cancelled" && (
        <div className="space-y-2 pt-1">
          {cancelledRecordId && (
            <p className="text-xs text-text-light text-center">カルテ履歴にキャンセル記録があります</p>
          )}
          <button
            onClick={() => simpleStatusChange("scheduled")}
            disabled={loading}
            className="block w-full text-center text-sm text-text-light hover:text-accent transition-colors min-h-[44px] disabled:opacity-50"
          >
            キャンセルを取り消す
          </button>
        </div>
      )}

      {showCancelDialog && (
        <CancellationDialog
          customerName={customerName}
          courseTickets={courseTickets}
          onCancel={() => setShowCancelDialog(false)}
          onSubmit={handleCancellationSubmit}
        />
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
