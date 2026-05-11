"use client";

import { useEffect, useState } from "react";
import { CancellationFeeFields, type CancellationFeeState, type CancellationFeeTicket } from "@/components/records/cancellation-fee-fields";

export type CancellationSubmitData = {
  reason: string;
  fee: CancellationFeeState;
};

type Props = {
  customerName: string;
  courseTickets: CancellationFeeTicket[];
  /** 予約メニューの合計金額。キャンセル料の初期値として使う */
  suggestedAmount?: number;
  onCancel: () => void;
  onSubmit: (data: CancellationSubmitData) => Promise<void>;
};

export function CancellationDialog({ customerName, courseTickets, suggestedAmount, onCancel, onSubmit }: Props) {
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [fee, setFee] = useState<CancellationFeeState>({ enabled: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onCancel, 200);
  };

  const handleSubmit = async () => {
    setError("");
    if (fee.enabled) {
      if (fee.paymentType === "ticket" && !fee.ticketId) {
        setError("使用する回数券を選んでください");
        return;
      }
      if ((fee.paymentType === "cash" || fee.paymentType === "credit") && fee.amount <= 0) {
        setError("金額を入力してください");
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({ reason: reason.trim(), fee });
      setVisible(false);
      setTimeout(onCancel, 200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        visible ? "bg-text/30 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={() => { if (!submitting) handleClose(); }}
    >
      <div
        className={`bg-surface rounded-2xl max-w-md w-full shadow-xl transition-all duration-200 max-h-[90vh] overflow-y-auto ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold">予約をキャンセルしますか？</h2>
          <p className="text-sm text-text-light mt-1">{customerName} さん</p>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">キャンセル理由（任意）</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="例: 体調不良のため当日キャンセル"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              disabled={submitting}
            />
          </div>

          <CancellationFeeFields
            value={fee}
            onChange={setFee}
            courseTickets={courseTickets}
            suggestedAmount={suggestedAmount}
            disabled={submitting}
          />
        </div>

        <div className="p-5 border-t border-border flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 min-h-[48px] disabled:opacity-50"
          >
            もどる
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-accent hover:bg-accent-light text-white font-bold rounded-xl py-3 min-h-[48px] disabled:opacity-50"
          >
            {submitting ? "保存中..." : "キャンセルする"}
          </button>
        </div>
      </div>
    </div>
  );
}

export type CancellationDialogTicket = CancellationFeeTicket;
