"use client";

import { useState } from "react";
import type { TemplateField, FieldType } from "@/types/counseling-template";

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "テキスト（1行）",
  textarea: "長文テキスト",
  checkbox: "チェックボックス（複数選択）",
  radio: "ラジオボタン（単一選択）",
};

type Props = {
  field?: TemplateField;
  onSave: (field: TemplateField) => void;
  onCancel: () => void;
};

/** フィールド追加・編集フォーム */
export function FieldEditor({ field, onSave, onCancel }: Props) {
  const [label, setLabel] = useState(field?.label ?? "");
  const [type, setType] = useState<FieldType>(field?.type ?? "text");
  const [placeholder, setPlaceholder] = useState(field?.placeholder ?? "");
  const [required, setRequired] = useState(field?.required ?? false);
  const [optionsText, setOptionsText] = useState(
    field?.options?.join("\n") ?? ""
  );

  const needsOptions = type === "checkbox" || type === "radio";

  const handleSave = () => {
    if (!label.trim()) return;

    const options = needsOptions
      ? optionsText
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean)
      : undefined;

    if (needsOptions && (!options || options.length < 2)) return;

    onSave({
      id: field?.id ?? crypto.randomUUID().slice(0, 8),
      label: label.trim(),
      type,
      placeholder: !needsOptions && placeholder.trim() ? placeholder.trim() : undefined,
      options,
      required,
    });
  };

  return (
    <div className="bg-background rounded-xl p-3 space-y-3">
      <h4 className="text-sm font-bold">
        {field ? "フィールドを編集" : "フィールドを追加"}
      </h4>

      {/* ラベル */}
      <div>
        <label className="block text-xs font-medium mb-1">
          ラベル <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="例: アレルギーの有無"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      {/* 型選択 */}
      <div>
        <label className="block text-xs font-medium mb-1">入力タイプ</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FieldType)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          {Object.entries(FIELD_TYPE_LABELS).map(([key, lbl]) => (
            <option key={key} value={key}>
              {lbl}
            </option>
          ))}
        </select>
      </div>

      {/* プレースホルダー（text/textarea のみ） */}
      {!needsOptions && (
        <div>
          <label className="block text-xs font-medium mb-1">
            プレースホルダー
          </label>
          <input
            type="text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="例: 花粉、金属など"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      )}

      {/* 選択肢（checkbox/radio のみ） */}
      {needsOptions && (
        <div>
          <label className="block text-xs font-medium mb-1">
            選択肢（1行に1つ） <span className="text-error">*</span>
          </label>
          <textarea
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            placeholder={"選択肢A\n選択肢B\n選択肢C"}
            rows={4}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <p className="text-xs text-text-light mt-1">
            2つ以上の選択肢が必要です
          </p>
        </div>
      )}

      {/* 必須 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
          className="w-4 h-4 accent-accent"
        />
        <span className="text-sm">回答を必須にする</span>
      </label>

      {/* ボタン */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-surface border border-border text-sm font-medium rounded-lg py-2 min-h-[44px]"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!label.trim() || (needsOptions && optionsText.split("\n").filter((o) => o.trim()).length < 2)}
          className="flex-1 bg-accent text-white text-sm font-medium rounded-lg py-2 min-h-[44px] disabled:opacity-50"
        >
          {field ? "更新する" : "追加する"}
        </button>
      </div>
    </div>
  );
}
