"use client";

import { useState } from "react";
import type { TemplateSection, TemplateField } from "@/types/counseling-template";
import { FieldEditor } from "./field-editor";

const FIELD_TYPE_SHORT: Record<string, string> = {
  text: "テキスト",
  textarea: "長文",
  checkbox: "チェック",
  radio: "ラジオ",
};

type Props = {
  section: TemplateSection;
  index: number;
  onChange: (section: TemplateSection) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
};

/** 1セクション分の編集UI（展開/折りたたみ式） */
export function SectionEditor({
  section, index, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [addingField, setAddingField] = useState(false);

  const updateField = (fieldIdx: number, field: TemplateField) => {
    const newFields = [...section.fields];
    newFields[fieldIdx] = field;
    onChange({ ...section, fields: newFields });
    setEditingFieldIdx(null);
  };

  const addField = (field: TemplateField) => {
    onChange({ ...section, fields: [...section.fields, field] });
    setAddingField(false);
  };

  const deleteField = (fieldIdx: number) => {
    onChange({ ...section, fields: section.fields.filter((_, i) => i !== fieldIdx) });
  };

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= section.fields.length) return;
    const newFields = [...section.fields];
    [newFields[from], newFields[to]] = [newFields[to], newFields[from]];
    onChange({ ...section, fields: newFields });
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* ヘッダー（折りたたみ） */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left min-h-[48px]"
      >
        <span className="text-xs text-text-light font-medium bg-background rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {section.title || "（無題のセクション）"}
          </p>
          <p className="text-xs text-text-light">
            {section.fields.length}個のフィールド
            {section.description ? " ・ 説明文あり" : ""}
          </p>
        </div>
        <span className="text-text-light text-sm flex-shrink-0">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {/* 操作ボタン */}
      <div className="flex items-center gap-1 px-3 pb-2 border-t border-border pt-2">
        <button type="button" onClick={onMoveUp} disabled={isFirst}
          className="text-xs px-2 py-1.5 rounded-lg hover:bg-accent/5 text-accent disabled:opacity-30 min-h-[44px]">
          ↑
        </button>
        <button type="button" onClick={onMoveDown} disabled={isLast}
          className="text-xs px-2 py-1.5 rounded-lg hover:bg-accent/5 text-accent disabled:opacity-30 min-h-[44px]">
          ↓
        </button>
        <div className="flex-1" />
        <button type="button" onClick={onDelete}
          className="text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px]">
          削除
        </button>
      </div>

      {/* 展開時のコンテンツ */}
      {expanded && (
        <div className="border-t border-border p-3 space-y-3">
          {/* セクションタイトル */}
          <div>
            <label className="block text-xs font-medium mb-1">
              セクション名 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={section.title}
              onChange={(e) => onChange({ ...section, title: e.target.value })}
              placeholder="例: 健康状態について"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* セクション説明文 */}
          <div>
            <label className="block text-xs font-medium mb-1">
              説明文（注意事項・同意文書など）
            </label>
            <textarea
              value={section.description ?? ""}
              onChange={(e) => onChange({ ...section, description: e.target.value || undefined })}
              placeholder="顧客に表示する説明テキスト（任意）"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* フィールド一覧 */}
          <div>
            <p className="text-xs font-medium mb-2">フィールド一覧</p>
            {section.fields.length === 0 ? (
              <p className="text-xs text-text-light py-2">
                フィールドがありません（説明文のみのセクションとして使えます）
              </p>
            ) : (
              <div className="space-y-2">
                {section.fields.map((field, fi) =>
                  editingFieldIdx === fi ? (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      onSave={(f) => updateField(fi, f)}
                      onCancel={() => setEditingFieldIdx(null)}
                    />
                  ) : (
                    <div key={field.id} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm">{field.label}</span>
                        <span className="text-xs text-text-light ml-2">
                          {FIELD_TYPE_SHORT[field.type] ?? field.type}
                          {field.required && " ・ 必須"}
                        </span>
                      </div>
                      <button type="button" onClick={() => moveField(fi, fi - 1)} disabled={fi === 0}
                        className="text-xs text-accent px-1 py-1 disabled:opacity-30 min-h-[44px]">↑</button>
                      <button type="button" onClick={() => moveField(fi, fi + 1)} disabled={fi === section.fields.length - 1}
                        className="text-xs text-accent px-1 py-1 disabled:opacity-30 min-h-[44px]">↓</button>
                      <button type="button" onClick={() => setEditingFieldIdx(fi)}
                        className="text-xs text-accent px-2 py-1 rounded-lg hover:bg-accent/5 min-h-[44px]">編集</button>
                      <button type="button" onClick={() => deleteField(fi)}
                        className="text-xs text-error px-2 py-1 rounded-lg hover:bg-error/5 min-h-[44px]">削除</button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* フィールド追加 */}
            {addingField ? (
              <div className="mt-2">
                <FieldEditor onSave={addField} onCancel={() => setAddingField(false)} />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingField(true)}
                className="mt-2 text-sm text-accent font-medium hover:underline min-h-[44px]"
              >
                + フィールドを追加
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
