"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPhotoUrls, deletePhoto, uploadPhotos, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/supabase/storage";
import type { PhotoEntry } from "@/components/records/photo-upload";
import type { Database } from "@/types/database";

type TreatmentPhoto = Database["public"]["Tables"]["treatment_photos"]["Row"];

export function PhotoManageSection({ recordId, salonId }: { recordId: string; salonId: string }) {
  const [photos, setPhotos] = useState<TreatmentPhoto[]>([]);
  const [urlMap, setUrlMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addingTypeRef = useRef<"before" | "after">("before");

  const loadPhotos = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("treatment_photos")
      .select("id, treatment_record_id, storage_path, photo_type, memo, created_at")
      .eq("treatment_record_id", recordId)
      .order("photo_type")
      .returns<TreatmentPhoto[]>();

    const list = data ?? [];
    setPhotos(list);
    if (list.length > 0) {
      const urls = await getPhotoUrls(list.map((p) => p.storage_path));
      setUrlMap(urls);
    }
    setLoading(false);
  };

  useEffect(() => { loadPhotos(); }, [recordId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (photo: TreatmentPhoto) => {
    setDeletingId(photo.id);
    setError(null);
    try {
      await deletePhoto(photo.id, photo.storage_path);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setConfirmId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "写真の削除に失敗しました");
    }
    setDeletingId(null);
  };

  const handleAddClick = (type: "before" | "after") => {
    addingTypeRef.current = type;
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (file.size > MAX_FILE_SIZE) {
      setError(`ファイルサイズが大きすぎます（${Math.round(file.size / 1024 / 1024)}MB）。20MB以下の画像をお使いください。`);
      return;
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("対応していないファイル形式です。JPEG, PNG, WebP, HEIC形式の画像をお使いください。");
      return;
    }

    setUploading(true);
    setError(null);
    const entry: PhotoEntry = { file, preview: "", type: addingTypeRef.current, memo: "" };
    const result = await uploadPhotos(recordId, salonId, [entry]);
    if (result.errors.length > 0) {
      setError(result.errors[0]);
    }
    await loadPhotos();
    setUploading(false);
  };

  if (loading) return <p className="text-text-light text-sm py-2">写真を読み込み中...</p>;

  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">施術写真</h3>
      <p className="text-xs text-text-light">写真の追加・削除は自動で保存されます</p>
      {error && <p className="text-error text-sm">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileSelect}
        className="hidden"
      />

      <PhotoGroup
        label="施術前"
        photos={beforePhotos}
        urlMap={urlMap}
        confirmId={confirmId}
        deletingId={deletingId}
        uploading={uploading}
        onConfirm={setConfirmId}
        onDelete={handleDelete}
        onCancel={() => setConfirmId(null)}
        onAdd={() => handleAddClick("before")}
      />

      <PhotoGroup
        label="施術後"
        photos={afterPhotos}
        urlMap={urlMap}
        confirmId={confirmId}
        deletingId={deletingId}
        uploading={uploading}
        onConfirm={setConfirmId}
        onDelete={handleDelete}
        onCancel={() => setConfirmId(null)}
        onAdd={() => handleAddClick("after")}
      />
    </div>
  );
}

function PhotoGroup({
  label, photos, urlMap, confirmId, deletingId, uploading, onConfirm, onDelete, onCancel, onAdd,
}: {
  label: string;
  photos: TreatmentPhoto[];
  urlMap: Map<string, string>;
  confirmId: string | null;
  deletingId: string | null;
  uploading: boolean;
  onConfirm: (id: string) => void;
  onDelete: (photo: TreatmentPhoto) => void;
  onCancel: () => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-text-light">{label}</p>
        <button
          type="button"
          onClick={onAdd}
          disabled={uploading}
          className="text-xs text-accent hover:underline min-h-[44px] flex items-center disabled:opacity-50"
        >
          {uploading ? "アップロード中..." : "+ 写真を追加"}
        </button>
      </div>
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo) => {
            const url = urlMap.get(photo.storage_path);
            const isConfirming = confirmId === photo.id;
            const isDeleting = deletingId === photo.id;
            return (
              <div key={photo.id} className="bg-background border border-border rounded-xl overflow-hidden">
                {url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={url} alt={label} loading="lazy" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="aspect-square flex items-center justify-center text-text-light text-sm">読み込めません</div>
                )}
                {photo.memo && <p className="text-xs text-text-light px-2 py-1">{photo.memo}</p>}
                <div className="px-2 py-1.5">
                  {isConfirming ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onDelete(photo)} disabled={isDeleting} className="text-xs text-error font-medium min-h-[44px] flex-1">
                        {isDeleting ? "削除中..." : "削除する"}
                      </button>
                      <button type="button" onClick={onCancel} disabled={isDeleting} className="text-xs text-text-light min-h-[44px] flex-1">
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => onConfirm(photo.id)} className="text-xs text-error hover:bg-error/5 px-2 py-1.5 rounded-lg min-h-[44px] w-full text-center">
                      削除
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
          <button type="button" onClick={onAdd} disabled={uploading} className="text-text-light text-sm disabled:opacity-50">
            {uploading ? "アップロード中..." : `タップして${label}の写真を追加`}
          </button>
        </div>
      )}
    </div>
  );
}
