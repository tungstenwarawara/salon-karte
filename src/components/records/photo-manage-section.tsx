"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPhotoUrls, deletePhoto } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type TreatmentPhoto = Database["public"]["Tables"]["treatment_photos"]["Row"];

export function PhotoManageSection({ recordId }: { recordId: string }) {
  const [photos, setPhotos] = useState<TreatmentPhoto[]>([]);
  const [urlMap, setUrlMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
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
    load();
  }, [recordId]);

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

  if (loading) return <p className="text-text-light text-sm py-2">写真を読み込み中...</p>;
  if (photos.length === 0) return null;

  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">施術写真</h3>
      {error && <p className="text-error text-sm">{error}</p>}

      {beforePhotos.length > 0 && (
        <PhotoGroup
          label="施術前"
          photos={beforePhotos}
          urlMap={urlMap}
          confirmId={confirmId}
          deletingId={deletingId}
          onConfirm={setConfirmId}
          onDelete={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {afterPhotos.length > 0 && (
        <PhotoGroup
          label="施術後"
          photos={afterPhotos}
          urlMap={urlMap}
          confirmId={confirmId}
          deletingId={deletingId}
          onConfirm={setConfirmId}
          onDelete={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}

function PhotoGroup({
  label, photos, urlMap, confirmId, deletingId, onConfirm, onDelete, onCancel,
}: {
  label: string;
  photos: TreatmentPhoto[];
  urlMap: Map<string, string>;
  confirmId: string | null;
  deletingId: string | null;
  onConfirm: (id: string) => void;
  onDelete: (photo: TreatmentPhoto) => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <p className="text-xs text-text-light mb-1.5">{label}</p>
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
                    <button
                      type="button"
                      onClick={() => onDelete(photo)}
                      disabled={isDeleting}
                      className="text-xs text-error font-medium min-h-[44px] flex-1"
                    >
                      {isDeleting ? "削除中..." : "削除する"}
                    </button>
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={isDeleting}
                      className="text-xs text-text-light min-h-[44px] flex-1"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onConfirm(photo.id)}
                    className="text-xs text-error hover:bg-error/5 px-2 py-1.5 rounded-lg min-h-[44px] w-full text-center"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
