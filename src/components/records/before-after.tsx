"use client";

import { useEffect, useState, useMemo } from "react";
import { getPhotoUrls } from "@/lib/supabase/storage";
import { PhotoLightbox, type LightboxPhoto } from "@/components/ui/photo-lightbox";
import type { Database } from "@/types/database";

type TreatmentPhoto = Database["public"]["Tables"]["treatment_photos"]["Row"];

export function BeforeAfterComparison({
  photos,
  serverUrlMap,
}: {
  photos: TreatmentPhoto[];
  serverUrlMap?: Record<string, string>;
}) {
  // サーバー側でURLが取得済みならそのまま使う（クライアント側fetchを排除 → INP改善）
  const hasServerUrls = serverUrlMap && Object.keys(serverUrlMap).length > 0;
  const [urlMap, setUrlMap] = useState<Map<string, string>>(
    hasServerUrls ? new Map(Object.entries(serverUrlMap)) : new Map()
  );
  const [loading, setLoading] = useState(!hasServerUrls);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // サーバーURLがない場合のみクライアント側で取得（フォールバック）
  useEffect(() => {
    if (hasServerUrls || photos.length === 0) {
      setLoading(false);
      return;
    }
    const paths = photos.map((p) => p.storage_path);
    getPhotoUrls(paths).then((map) => {
      setUrlMap(map);
      setLoading(false);
    });
  }, [photos, hasServerUrls]);

  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");
  const otherPhotos = photos.filter((p) => p.photo_type === "other");

  // ライトボックス用: 全写真をフラット配列化
  const allPhotos = useMemo(() => [
    ...beforePhotos.map((p) => ({ photo: p, label: "施術前" })),
    ...afterPhotos.map((p) => ({ photo: p, label: "施術後" })),
    ...otherPhotos.map((p) => ({ photo: p, label: "その他" })),
  ], [beforePhotos, afterPhotos, otherPhotos]);

  const lightboxPhotos: LightboxPhoto[] = useMemo(() =>
    allPhotos.map(({ photo, label }) => ({
      url: urlMap.get(photo.storage_path) ?? "",
      label,
      memo: photo.memo ?? undefined,
      date: photo.created_at ?? undefined,
    })),
  [allPhotos, urlMap]);

  const getPhotoIndex = (photo: TreatmentPhoto) =>
    allPhotos.findIndex((p) => p.photo.id === photo.id);

  if (photos.length === 0) return null;

  const hasBoth = beforePhotos.length > 0 && afterPhotos.length > 0;

  return (
    <div className="space-y-4">
      <h3 className="font-bold">施術写真</h3>

      {loading ? (
        <div className="text-text-light text-sm py-4 text-center">
          写真を読み込み中...
        </div>
      ) : (
        <>
          {/* 施術前後が両方ある場合: 横並び比較 */}
          {hasBoth && (
            <div className="space-y-3">
              {beforePhotos.map((before, i) => {
                const after = afterPhotos[i];
                return (
                  <div key={before.id} className="grid grid-cols-2 gap-2">
                    <PhotoCard photo={before} url={urlMap.get(before.storage_path)} label="施術前" onClick={() => setLightboxIndex(getPhotoIndex(before))} />
                    {after ? (
                      <PhotoCard photo={after} url={urlMap.get(after.storage_path)} label="施術後" onClick={() => setLightboxIndex(getPhotoIndex(after))} />
                    ) : (
                      <div className="bg-background border border-border rounded-xl aspect-square flex items-center justify-center text-text-light text-sm">
                        施術後の写真なし
                      </div>
                    )}
                  </div>
                );
              })}
              {/* 施術後のみ余りがある場合 */}
              {afterPhotos.length > beforePhotos.length && (
                <div className="grid grid-cols-2 gap-2">
                  {afterPhotos.slice(beforePhotos.length).map((photo) => (
                    <div key={photo.id} className="col-start-2">
                      <PhotoCard photo={photo} url={urlMap.get(photo.storage_path)} label="施術後" onClick={() => setLightboxIndex(getPhotoIndex(photo))} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 施術前のみ */}
          {!hasBoth && beforePhotos.length > 0 && (
            <div>
              <p className="text-sm text-text-light mb-2">施術前</p>
              <div className="grid grid-cols-2 gap-2">
                {beforePhotos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} url={urlMap.get(photo.storage_path)} onClick={() => setLightboxIndex(getPhotoIndex(photo))} />
                ))}
              </div>
            </div>
          )}

          {/* 施術後のみ */}
          {!hasBoth && afterPhotos.length > 0 && (
            <div>
              <p className="text-sm text-text-light mb-2">施術後</p>
              <div className="grid grid-cols-2 gap-2">
                {afterPhotos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} url={urlMap.get(photo.storage_path)} onClick={() => setLightboxIndex(getPhotoIndex(photo))} />
                ))}
              </div>
            </div>
          )}

          {/* その他の写真 */}
          {otherPhotos.length > 0 && (
            <div>
              <p className="text-sm text-text-light mb-2">その他の写真</p>
              <div className="grid grid-cols-2 gap-2">
                {otherPhotos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} url={urlMap.get(photo.storage_path)} onClick={() => setLightboxIndex(getPhotoIndex(photo))} />
                ))}
              </div>
            </div>
          )}

          {/* ライトボックス */}
          {lightboxIndex !== null && (
            <PhotoLightbox
              photos={lightboxPhotos}
              initialIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

/** 個別の写真カード（URLはpropsで受け取り、自身ではfetchしない） */
function PhotoCard({
  photo,
  url,
  label,
  onClick,
}: {
  photo: TreatmentPhoto;
  url?: string;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-background border border-border rounded-xl overflow-hidden text-left w-full cursor-pointer"
    >
      {label && (
        <div className="px-2 py-1 bg-primary/10">
          <span className="text-xs font-medium text-primary">{label}</span>
        </div>
      )}
      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt={label ?? "施術写真"}
          loading="lazy"
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div className="aspect-square flex items-center justify-center text-text-light text-sm">
          読み込めません
        </div>
      )}
      {(photo.memo || photo.created_at) && (
        <div className="px-2 py-1.5 space-y-0.5">
          {photo.created_at && (
            <p className="text-[10px] text-text-light">
              {new Date(photo.created_at).toLocaleDateString("ja-JP")}
            </p>
          )}
          {photo.memo && (
            <p className="text-xs text-text-light">{photo.memo}</p>
          )}
        </div>
      )}
    </button>
  );
}
