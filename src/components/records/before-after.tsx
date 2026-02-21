"use client";

import { useEffect, useState } from "react";
import { getPhotoUrls } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type TreatmentPhoto = Database["public"]["Tables"]["treatment_photos"]["Row"];

export function BeforeAfterComparison({
  photos,
}: {
  photos: TreatmentPhoto[];
}) {
  const [urlMap, setUrlMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  // 全写真のSigned URLを一括取得（N+1問題の解消）
  useEffect(() => {
    if (photos.length === 0) {
      setLoading(false);
      return;
    }
    const paths = photos.map((p) => p.storage_path);
    getPhotoUrls(paths).then((map) => {
      setUrlMap(map);
      setLoading(false);
    });
  }, [photos]);

  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");

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
                    <PhotoCard photo={before} url={urlMap.get(before.storage_path)} label="施術前" />
                    {after ? (
                      <PhotoCard photo={after} url={urlMap.get(after.storage_path)} label="施術後" />
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
                      <PhotoCard photo={photo} url={urlMap.get(photo.storage_path)} label="施術後" />
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
                  <PhotoCard key={photo.id} photo={photo} url={urlMap.get(photo.storage_path)} />
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
                  <PhotoCard key={photo.id} photo={photo} url={urlMap.get(photo.storage_path)} />
                ))}
              </div>
            </div>
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
}: {
  photo: TreatmentPhoto;
  url?: string;
  label?: string;
}) {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
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
      {photo.memo && (
        <div className="px-2 py-1.5">
          <p className="text-xs text-text-light">{photo.memo}</p>
        </div>
      )}
    </div>
  );
}
