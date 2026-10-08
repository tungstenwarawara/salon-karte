"use client";

type Props = {
  isPreview: boolean;
  onChange: (isPreview: boolean) => void;
};

/** テンプレート編集画面の「編集 / プレビュー」切替 */
export function EditPreviewToggle({ isPreview, onChange }: Props) {
  const tabClass = (active: boolean) =>
    `flex-1 text-sm font-medium rounded-lg py-2 min-h-[44px] transition-colors ${
      active ? "bg-surface shadow text-text" : "text-text-light"
    }`;

  return (
    <div className="flex bg-background rounded-xl p-1">
      <button type="button" onClick={() => onChange(false)} className={tabClass(!isPreview)}>
        編集
      </button>
      <button type="button" onClick={() => onChange(true)} className={tabClass(isPreview)}>
        プレビュー
      </button>
    </div>
  );
}
