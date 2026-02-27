"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPhotoUrls, deletePhoto, uploadPhotos, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/supabase/storage";
import type { PhotoEntry } from "@/components/records/photo-upload";
import type { Database } from "@/types/database";
import { PhotoGroup } from "./photo-group";

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
  const addingTypeRef = useRef<"before" | "after" | "other">("before");

  const loadPhotos = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("treatment_photos")
      .select("id, treatment_record_id, storage_path, photo_type, memo, sort_order, created_at")
      .eq("treatment_record_id", recordId)
      .order("photo_type")
      .order("sort_order")
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
      await deletePhoto(photo.id, photo.storage_path, salonId);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setConfirmId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "写真の削除に失敗しました");
    }
    setDeletingId(null);
  };

  const handleAddClick = (type: "before" | "after" | "other") => {
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
    // 同一タイプ内の最大sort_order + 1 を計算
    const sameTypePhotos = photos.filter(p => p.photo_type === addingTypeRef.current);
    const nextSortOrder = sameTypePhotos.length > 0
      ? Math.max(...sameTypePhotos.map(p => p.sort_order)) + 1
      : 0;
    const entry: PhotoEntry = { file, preview: "", type: addingTypeRef.current, memo: "" };
    const result = await uploadPhotos(recordId, salonId, [entry], [nextSortOrder]);
    if (result.errors.length > 0) {
      setError(result.errors[0]);
    }
    await loadPhotos();
    setUploading(false);
  };

  if (loading) return <p className="text-text-light text-sm py-2">写真を読み込み中...</p>;

  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");
  const otherPhotos = photos.filter((p) => p.photo_type === "other");

  const groupProps = {
    urlMap, confirmId, deletingId, uploading,
    onConfirm: setConfirmId, onDelete: handleDelete, onCancel: () => setConfirmId(null),
  };

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

      <PhotoGroup label="施術前" photos={beforePhotos} {...groupProps} onAdd={() => handleAddClick("before")} />
      <PhotoGroup label="施術後" photos={afterPhotos} {...groupProps} onAdd={() => handleAddClick("after")} />
      <PhotoGroup label="その他の写真" photos={otherPhotos} {...groupProps} onAdd={() => handleAddClick("other")} />
    </div>
  );
}
