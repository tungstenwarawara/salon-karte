"use client";

import { useEffect, useState } from "react";

type CourseTicket = {
  id: string;
  ticket_name: string;
  total_sessions: number;
  used_sessions: number;
};

type FeePaymentType = "service" | "cash" | "credit" | "ticket";

export type CancellationSubmitData = {
  reason: string;
  fee:
    | { enabled: false }
    | {
        enabled: true;
        paymentType: FeePaymentType;
        amount: number;
        ticketId: string | null;
      };
};

type Props = {
  customerName: string;
  courseTickets: CourseTicket[];
  /** 予約メニューの合計金額。キャンセル料の初期値として使う */
  suggestedAmount?: number;
  onCancel: () => void;
  onSubmit: (data: CancellationSubmitData) => Promise<void>;
};

const FEE_OPTIONS: { value: FeePaymentType; label: string; helper?: string }[] = [
  { value: "service", label: "無料にする" },
  { value: "cash", label: "現金でもらう" },
  { value: "credit", label: "カード・振込でもらう" },
  { value: "ticket", label: "お持ちの回数券から1回引く" },
];

export function CancellationDialog({ customerName, courseTickets, suggestedAmount, onCancel, onSubmit }: Props) {
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [feeEnabled, setFeeEnabled] = useState(false);
  const [feeType, setFeeType] = useState<FeePaymentType>("service");
  const [amount, setAmount] = useState(suggestedAmount && suggestedAmount > 0 ? String(suggestedAmount) : "");
  const [ticketId, setTicketId] = useState<string | null>(null);
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
    if (feeEnabled) {
      if (feeType === "ticket" && !ticketId) {
        setError("使用する回数券を選んでください");
        return;
      }
      if ((feeType === "cash" || feeType === "credit") && (!amount || parseInt(amount, 10) <= 0)) {
        setError("金額を入力してください");
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({
        reason: reason.trim(),
        fee: feeEnabled
          ? {
              enabled: true,
              paymentType: feeType,
              amount: feeType === "service" ? 0 : parseInt(amount, 10) || 0,
              ticketId: feeType === "ticket" ? ticketId : null,
            }
          : { enabled: false },
      });
      setVisible(false);
      setTimeout(onCancel, 200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setSubmitting(false);
    }
  };

  const activeTickets = courseTickets.filter((t) => t.total_sessions - t.used_sessions > 0);

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

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={feeEnabled}
                onChange={(e) => setFeeEnabled(e.target.checked)}
                className="w-4 h-4 accent-accent"
                disabled={submitting}
              />
              <span className="text-sm font-medium">キャンセル料を記録する</span>
            </label>
          </div>

          {feeEnabled && (
            <div className="space-y-3 bg-background rounded-xl p-3 border border-border">
              <div className="space-y-2">
                {FEE_OPTIONS.map((opt) => {
                  const isTicket = opt.value === "ticket";
                  const disabled = submitting || (isTicket && activeTickets.length === 0);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <input
                        type="radio"
                        name="feeType"
                        value={opt.value}
                        checked={feeType === opt.value}
                        onChange={() => { setFeeType(opt.value); if (opt.value !== "ticket") setTicketId(null); }}
                        disabled={disabled}
                        className="accent-accent"
                      />
                      <span className="text-sm">{opt.label}</span>
                      {isTicket && activeTickets.length === 0 && (
                        <span className="text-xs text-text-light">（利用可能な回数券なし）</span>
                      )}
                    </label>
                  );
                })}
              </div>

              {feeType === "ticket" && activeTickets.length > 0 && (
                <div>
                  <label className="block text-xs font-medium mb-1">使用する回数券</label>
                  <select
                    value={ticketId ?? ""}
                    onChange={(e) => setTicketId(e.target.value || null)}
                    disabled={submitting}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <option value="">選択してください</option>
                    {activeTickets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.ticket_name}（残 {t.total_sessions - t.used_sessions}回）
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(feeType === "cash" || feeType === "credit") && (
                <div>
                  <label className="block text-xs font-medium mb-1">金額</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="例: 3000"
                      min={0}
                      disabled={submitting}
                      className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                    />
                    <span className="text-sm text-text-light">円</span>
                  </div>
                  {suggestedAmount && suggestedAmount > 0 && (
                    <p className="text-xs text-text-light mt-1">予約メニューの合計金額を初期値に入れています</p>
                  )}
                </div>
              )}

              <p className="text-xs text-text-light">来店分析にはカウントされません</p>
            </div>
          )}
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

export type { CourseTicket as CancellationDialogTicket };
