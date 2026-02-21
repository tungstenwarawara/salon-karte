/** 写真カード（プレビュー + メモ + 削除ボタン） */
export function PhotoCard({
  photo,
  onRemove,
  onMemoChange,
}: {
  photo: { preview: string; type: "before" | "after"; memo: string };
  onRemove: () => void;
  onMemoChange: (memo: string) => void;
}) {
  return (
    <div className="relative bg-background border border-border rounded-xl overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.preview}
        alt={photo.type === "before" ? "施術前" : "施術後"}
        className="w-full aspect-square object-cover"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
      >
        ×
      </button>
      <div className="p-2">
        <input
          type="text"
          value={photo.memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="メモ（任意）"
          className="w-full text-xs bg-transparent border-none focus:outline-none placeholder:text-text-light/50"
        />
      </div>
    </div>
  );
}
