"use client";

import { OPTIONAL_CUSTOMER_INFO_FIELDS, type OptionalCustomerInfoField } from "@/lib/counseling-customer-info";

type Props = {
  hiddenFields: OptionalCustomerInfoField[];
  onChange: (hiddenFields: OptionalCustomerInfoField[]) => void;
};

/** お客様情報ステップで聞く項目の選択（テンプレート編集画面） */
export function CustomerInfoFieldsEditor({ hiddenFields, onChange }: Props) {
  const toggle = (key: OptionalCustomerInfoField) => {
    onChange(hiddenFields.includes(key) ? hiddenFields.filter((k) => k !== key) : [...hiddenFields, key]);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
      <p className="text-sm font-medium">お客様情報でお伺いする項目</p>
      <p className="text-xs text-text-light">
        シート発行時に「顧客情報の入力も含める」を選ぶと、最初のページに表示されます。
        お名前・フリガナ・電話番号・メールアドレスは必ずお伺いします。
      </p>
      <div className="grid grid-cols-2 gap-x-3">
        {OPTIONAL_CUSTOMER_INFO_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm min-h-[44px]">
            <input
              type="checkbox"
              checked={!hiddenFields.includes(key)}
              onChange={() => toggle(key)}
              className="w-4 h-4 accent-accent flex-shrink-0"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
