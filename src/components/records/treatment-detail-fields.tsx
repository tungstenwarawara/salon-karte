"use client";

import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { INPUT_CLASS } from "@/components/records/types";

type DetailForm = {
  products_used: string;
  skin_condition_before: string;
  notes_after: string;
  conversation_notes: string;
  caution_notes: string;
  next_visit_memo: string;
};

type Props = {
  form: DetailForm;
  onUpdate: (field: string, value: string) => void;
};

const FIELDS: { key: keyof DetailForm; label: string; placeholder: string; rows: number }[] = [
  { key: "products_used", label: "使用した化粧品・機器", placeholder: "使用した化粧品や機器を記録", rows: 2 },
  { key: "skin_condition_before", label: "施術前の状態", placeholder: "施術前の状態を記録", rows: 2 },
  { key: "notes_after", label: "施術後の経過メモ", placeholder: "施術後の状態や経過を記録", rows: 2 },
  { key: "conversation_notes", label: "話した内容（会話メモ）", placeholder: "お客様との会話で覚えておきたいこと", rows: 3 },
  { key: "caution_notes", label: "注意事項", placeholder: "次回以降に注意すべきこと", rows: 2 },
  { key: "next_visit_memo", label: "次回への申し送り", placeholder: "次回施術時の注意点やプランなど", rows: 2 },
];

/** 施術詳細フィールド群（CollapsibleSection内で使用） */
export function TreatmentDetailFields({ form, onUpdate }: Props) {
  return (
    <>
      {FIELDS.map(({ key, label, placeholder, rows }) => (
        <div key={key}>
          <label className="block text-sm font-medium mb-1.5">{label}</label>
          <AutoResizeTextarea
            value={form[key]}
            onChange={(e) => onUpdate(key, e.target.value)}
            placeholder={placeholder}
            minRows={rows}
            className={INPUT_CLASS}
          />
        </div>
      ))}
    </>
  );
}
