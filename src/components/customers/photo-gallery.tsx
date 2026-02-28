"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPhotoUrls } from "@/lib/supabase/storage";
import { PhotoLightbox, type LightboxPhoto } from "@/components/ui/photo-lightbox";
import { EmptyState } from "@/components/ui/empty-state";

type PhotoRow = {
  id: string;
  storage_path: string;
  photo_type: string;
  memo: string | null;
  created_at: string;
  treatment_record_id: string;
};

type Props = {
  recordIds: string[];
  recordDates: Map<string, string>; // recordId → treatment_date
};

const PHOTO_TYPE_LABELS: Record<string, string> = {
  before: "施術前",
  after: "施術後",
  other: "その他",
};

const INITIAL_GROUPS = 3;

export function PhotoGallery({ recordIds, recordDates }: Props) {
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [urlMap, setUrlMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAllGroups, setShowAllGroups] = useState(false);

  useEffect(() => {
    if (recordIds.length === 0) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("treatment_photos")
      .select("id, storage_path, photo_type, memo, created_at, treatment_record_id")
      .in("treatment_record_id", recordIds)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data ?? []) as PhotoRow[];
        setPhotos(rows);
        if (rows.length > 0) {
          getPhotoUrls(rows.map((p) => p.storage_path)).then(setUrlMap);
        }
        setLoading(false);
      });
  }, [recordIds]);

  // 施術日でグループ化（新しい順）
  const groups = useMemo(() => {
    const map = new Map<string, PhotoRow[]>();
    for (const photo of photos) {
      const date = recordDates.get(photo.treatment_record_id) ?? "不明";
      const existing = map.get(date) ?? [];
      existing.push(photo);
      map.set(date, existing);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [photos, recordDates]);

  const visibleGroups = showAllGroups ? groups : groups.slice(0, INITIAL_GROUPS);
  const hiddenGroupCount = groups.length - INITIAL_GROUPS;

  const lightboxPhotos: LightboxPhoto[] = useMemo(() =>
    photos.map((p) => ({
      url: urlMap.get(p.storage_path) ?? "",
      label: PHOTO_TYPE_LABELS[p.photo_type] ?? p.photo_type,
      memo: p.memo ?? undefined,
      date: p.created_at,
    })),
  [photos, urlMap]);

  if (loading) {
    return <div className="text-text-light text-sm py-8 text-center">写真を読み込み中...</div>;
  }

  if (photos.length === 0) {
    return (
      <EmptyState
        illustration="record"
        message="写真はまだありません"
      />
    );
  }

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {visibleGroups.map(([date, groupPhotos]) => (
        <div key={date}>
          <p className="text-xs text-text-light font-medium mb-2">
            {formatDate(date)} のカルテ（{groupPhotos.length}枚）
          </p>
          <div className="grid grid-cols-3 gap-2">
            {groupPhotos.map((photo) => {
              const globalIndex = photos.findIndex((p) => p.id === photo.id);
              const url = urlMap.get(photo.storage_path);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(globalIndex)}
                  className="relative bg-background border border-border rounded-xl overflow-hidden aspect-square cursor-pointer"
                >
                  {url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={url} alt="施術写真" loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-light text-xs">読込中</div>
                  )}
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 text-center">
                    {PHOTO_TYPE_LABELS[photo.photo_type] ?? photo.photo_type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {hiddenGroupCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAllGroups(!showAllGroups)}
          className="w-full text-center text-sm text-accent py-2 min-h-[44px]"
        >
          {showAllGroups ? "閉じる" : `もっと見る（残り${hiddenGroupCount}回分）`}
        </button>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
