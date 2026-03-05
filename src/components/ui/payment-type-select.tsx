"use client";

type PaymentType = "cash" | "credit";

type Props = {
  value: PaymentType;
  onChange: (value: PaymentType) => void;
  /** 表示する会計ヒントの種類 */
  context: "sale" | "ticket";
  /** 金額（ヒント表示用） */
  amount?: number;
};

const ACCOUNTING_HINTS: Record<PaymentType, Record<Props["context"], string>> = {
  cash: {
    sale: "現金 / 売上高 として記録されます",
    ticket: "現金 / 前受金 として記録されます（施術時に売上に振替）",
  },
  credit: {
    sale: "売掛金 / 売上高 として記録されます（入金は後日）",
    ticket: "売掛金 / 前受金 として記録されます（施術時に売上に振替）",
  },
};

/** 支払方法選択 + 会計処理のヒント表示 */
export function PaymentTypeSelect({ value, onChange, context, amount }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">支払方法</label>
      <div className="flex gap-1 bg-background rounded-xl p-0.5">
        <button
          type="button"
          onClick={() => onChange("cash")}
          className={`flex-1 text-center text-xs font-medium py-2 rounded-lg transition-colors min-h-[44px] ${
            value === "cash" ? "bg-accent text-white shadow-sm" : "text-text-light hover:text-text"
          }`}
        >
          現金
        </button>
        <button
          type="button"
          onClick={() => onChange("credit")}
          className={`flex-1 text-center text-xs font-medium py-2 rounded-lg transition-colors min-h-[44px] ${
            value === "credit" ? "bg-accent text-white shadow-sm" : "text-text-light hover:text-text"
          }`}
        >
          クレジット
        </button>
      </div>
      <p className="text-[10px] text-text-light leading-relaxed px-1">
        {ACCOUNTING_HINTS[value][context]}
      </p>
    </div>
  );
}
