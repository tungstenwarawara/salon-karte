"use client";

import { useRef, useState } from "react";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/supabase/storage";

type PhotoEntry = {
  file: File;
  preview: string;
  type: "before" | "after";
  memo: string;
};

export function PhotoUpload({
  photos,
  onChange,
}: {
  photos: PhotoEntry[];
  onChange: (photos: PhotoEntry[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addingTypeRef = useRef<"before" | "after">("before");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setValidationError(null);

    // クライアント側バリデーション（UXのため即時フィードバック）
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / 1024 / 1024);
      setValidationError(
        `ファイルサイズが大きすぎます（${sizeMB}MB）。20MB以下の画像をお使いください。`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationError(
        "対応していないファイル形式です。JPEG, PNG, WebP, HEIC形式の画像をお使いください。"
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const preview = URL.createObjectURL(file);

    onChange([
      ...photos,
      { file, preview, type: addingTypeRef.current, memo: "" },
    ]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAdd = (type: "before" | "after") => {
    addingTypeRef.current = type;
    setValidationError(null);
    fileInputRef.current?.click();
  };

  const handleRemove = (index: number) => {
    // Revoke blob URL to prevent memory leak
    URL.revokeObjectURL(photos[index].preview);
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMemoChange = (index: number, memo: string) => {
    const updated = photos.map((p, i) => (i === index ? { ...p, memo } : p));
    onChange(updated);
  };

  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">施術写真</label>
        <span className="text-xs text-text-light">
          JPEG・PNG・WebP・HEIC（20MBまで）
        </span>
      </div>

      {/* バリデーションエラー表示 */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
          {validationError}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Before photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-light">施術前</span>
          <button
            type="button"
            onClick={() => handleAdd("before")}
            className="text-sm text-accent hover:underline"
          >
            + 写真を追加
          </button>
        </div>
        {beforePhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {beforePhotos.map((photo) => {
              const index = photos.indexOf(photo);
              return (
                <PhotoCard
                  key={index}
                  photo={photo}
                  onRemove={() => handleRemove(index)}
                  onMemoChange={(memo) => handleMemoChange(index, memo)}
                />
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
            <button
              type="button"
              onClick={() => handleAdd("before")}
              className="text-text-light text-sm"
            >
              タップして施術前の写真を追加
            </button>
          </div>
        )}
      </div>

      {/* After photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-light">施術後</span>
          <button
            type="button"
            onClick={() => handleAdd("after")}
            className="text-sm text-accent hover:underline"
          >
            + 写真を追加
          </button>
        </div>
        {afterPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {afterPhotos.map((photo) => {
              const index = photos.indexOf(photo);
              return (
                <PhotoCard
                  key={index}
                  photo={photo}
                  onRemove={() => handleRemove(index)}
                  onMemoChange={(memo) => handleMemoChange(index, memo)}
                />
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
            <button
              type="button"
              onClick={() => handleAdd("after")}
              className="text-text-light text-sm"
            >
              タップして施術後の写真を追加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoCard({
  photo,
  onRemove,
  onMemoChange,
}: {
  photo: PhotoEntry;
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

export type { PhotoEntry };
