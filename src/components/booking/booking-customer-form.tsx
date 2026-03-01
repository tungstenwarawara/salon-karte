"use client";

type Props = {
  lastName: string;
  firstName: string;
  phone: string;
  memo: string;
  hp: string;
  onLastNameChange: (v: string) => void;
  onFirstNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onMemoChange: (v: string) => void;
  onHpChange: (v: string) => void;
};

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors min-h-[48px]";

export function BookingCustomerForm({
  lastName,
  firstName,
  phone,
  memo,
  hp,
  onLastNameChange,
  onFirstNameChange,
  onPhoneChange,
  onMemoChange,
  onHpChange,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-light">
        お客様情報をご入力ください
      </p>

      {/* 姓・名 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            姓 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="山田"
            className={INPUT_CLASS}
            autoComplete="family-name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="花子"
            className={INPUT_CLASS}
            autoComplete="given-name"
          />
        </div>
      </div>

      {/* 電話番号 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          電話番号 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="09012345678"
          className={INPUT_CLASS}
          autoComplete="tel"
          inputMode="tel"
        />
        <p className="text-xs text-text-light mt-1">
          ハイフンなしで入力してください
        </p>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-sm font-medium mb-1">
          ご要望・メモ <span className="text-text-light font-normal">(任意)</span>
        </label>
        <textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="初めての来店です、など"
          rows={3}
          maxLength={500}
          className={`${INPUT_CLASS} min-h-[80px] resize-none`}
        />
        {memo.length > 0 && (
          <p className="text-xs text-text-light mt-1 text-right">
            {memo.length}/500
          </p>
        )}
      </div>

      {/* ハニーポット（非表示） */}
      <div className="absolute -left-[9999px] opacity-0 h-0 overflow-hidden" aria-hidden="true">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => onHpChange(e.target.value)}
        />
      </div>
    </div>
  );
}
