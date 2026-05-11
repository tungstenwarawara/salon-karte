"use client";

import { useEffect, useState } from "react";

export type CancellationFeePaymentType = "service" | "cash" | "credit" | "ticket";

export type CancellationFeeState =
  | { enabled: false }
  | {
      enabled: true;
      paymentType: CancellationFeePaymentType;
      amount: number;
      ticketId: string | null;
    };

type CourseTicket = {
  id: string;
  ticket_name: string;
  total_sessions: number;
  used_sessions: number;
};

type Props = {
  value: CancellationFeeState;
  onChange: (value: CancellationFeeState) => void;
  courseTickets: CourseTicket[];
  /** 予約メニュー合計など、初期値の提案。enabled になった瞬間に金額欄へ充てる */
  suggestedAmount?: number;
  disabled?: boolean;
};

const OPTIONS: { value: CancellationFeePaymentType; label: string }[] = [
  { value: "service", label: "無料にする" },
  { value: "cash", label: "現金でもらう" },
  { value: "credit", label: "カード・振込でもらう" },
  { value: "ticket", label: "お持ちの回数券から1回引く" },
];

/**
 * キャンセル料セクション（チェックボックスで開閉）。
 * - キャンセルダイアログ
 * - カルテ編集画面（種別=cancelled）
 * の両方で使われる共通UI。
 */
export function CancellationFeeFields({ value, onChange, courseTickets, suggestedAmount, disabled }: Props) {
  // 金額は string で持つ（入力中の中間状態を許容）。確定時に number に変換して親に通知
  const [amountStr, setAmountStr] = useState(value.enabled ? String(value.amount) : "");

  // value が外部更新された場合に同期（例: 編集画面の初期ロード）
  useEffect(() => {
    if (value.enabled) setAmountStr(String(value.amount));
    else setAmountStr("");
  }, [value.enabled, value.enabled ? value.amount : 0]);

  const activeTickets = courseTickets.filter((t) => t.total_sessions - t.used_sessions > 0);

  const handleToggle = (next: boolean) => {
    if (!next) {
      onChange({ enabled: false });
      return;
    }
    // 開いたとき: 既存値があれば維持、なければ suggestedAmount を初期値
    if (value.enabled) {
      onChange(value);
      return;
    }
    onChange({
      enabled: true,
      paymentType: "service",
      amount: suggestedAmount && suggestedAmount > 0 ? suggestedAmount : 0,
      ticketId: null,
    });
    setAmountStr(suggestedAmount && suggestedAmount > 0 ? String(suggestedAmount) : "");
  };

  const updateFee = (patch: Partial<Extract<CancellationFeeState, { enabled: true }>>) => {
    if (!value.enabled) return;
    onChange({ ...value, ...patch });
  };

  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          className="w-4 h-4 accent-accent"
          disabled={disabled}
        />
        <span className="text-sm font-medium">キャンセル料を記録する</span>
      </label>

      {value.enabled && (
        <div className="space-y-3 bg-background rounded-xl p-3 border border-border mt-2">
          <div className="space-y-2">
            {OPTIONS.map((opt) => {
              const isTicket = opt.value === "ticket";
              const noTickets = isTicket && activeTickets.length === 0;
              const isDisabled = disabled || noTickets;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name="cancellationFeeType"
                    value={opt.value}
                    checked={value.paymentType === opt.value}
                    onChange={() => updateFee({ paymentType: opt.value, ticketId: opt.value === "ticket" ? value.ticketId : null })}
                    disabled={isDisabled}
                    className="accent-accent"
                  />
                  <span className="text-sm">{opt.label}</span>
                  {noTickets && <span className="text-xs text-text-light">（利用可能な回数券なし）</span>}
                </label>
              );
            })}
          </div>

          {value.paymentType === "ticket" && activeTickets.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1">使用する回数券</label>
              <select
                value={value.ticketId ?? ""}
                onChange={(e) => updateFee({ ticketId: e.target.value || null })}
                disabled={disabled}
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

          {(value.paymentType === "cash" || value.paymentType === "credit") && (
            <div>
              <label className="block text-xs font-medium mb-1">金額</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={amountStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAmountStr(v);
                    updateFee({ amount: parseInt(v, 10) || 0 });
                  }}
                  placeholder="例: 3000"
                  min={0}
                  disabled={disabled}
                  className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                />
                <span className="text-sm text-text-light">円</span>
              </div>
              {suggestedAmount && suggestedAmount > 0 && parseInt(amountStr, 10) === suggestedAmount && (
                <p className="text-xs text-text-light mt-1">予約メニューの合計金額を初期値に入れています</p>
              )}
            </div>
          )}

          <p className="text-xs text-text-light">来店分析にはカウントされません</p>
        </div>
      )}
    </div>
  );
}

export type { CourseTicket as CancellationFeeTicket };
