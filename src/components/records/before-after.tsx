"use client";

import { useEffect, useState } from "react";
import { getPhotoUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

type TreatmentPhoto = Database["public"]["Tables"]["treatment_photos"]["Row"];

export function BeforeAfterComparison({
  photos,
}: {
  photos: TreatmentPhoto[];
}) {
  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");

  if (photos.length === 0) return null;

  const hasBoth = beforePhotos.length > 0 && afterPhotos.length > 0;

  return (
    <div className="space-y-4">
      <h3 className="font-bold">施術写真</h3>

      {/* Side-by-side comparison when both exist */}
      {hasBoth && (
        <div className="space-y-3">
          {beforePhotos.map((before, i) => {
            const after = afterPhotos[i];
            return (
              <div key={before.id} className="grid grid-cols-2 gap-2">
                <PhotoWithUrl photo={before} label="施術前" />
                {after ? (
                  <PhotoWithUrl photo={after} label="施術後" />
                ) : (
                  <div className="bg-background border border-border rounded-xl aspect-square flex items-center justify-center text-text-light text-sm">
                    施術後の写真なし
                  </div>
                )}
              </div>
            );
          })}
          {/* Remaining after photos without matching before */}
          {afterPhotos.length > beforePhotos.length && (
            <div className="grid grid-cols-2 gap-2">
              {afterPhotos.slice(beforePhotos.length).map((photo) => (
                <div key={photo.id} className="col-start-2">
                  <PhotoWithUrl photo={photo} label="施術後" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Only before photos */}
      {!hasBoth && beforePhotos.length > 0 && (
        <div>
          <p className="text-sm text-text-light mb-2">施術前</p>
          <div className="grid grid-cols-2 gap-2">
            {beforePhotos.map((photo) => (
              <PhotoWithUrl key={photo.id} photo={photo} />
            ))}
          </div>
        </div>
      )}

      {/* Only after photos */}
      {!hasBoth && afterPhotos.length > 0 && (
        <div>
          <p className="text-sm text-text-light mb-2">施術後</p>
          <div className="grid grid-cols-2 gap-2">
            {afterPhotos.map((photo) => (
              <PhotoWithUrl key={photo.id} photo={photo} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoWithUrl({
  photo,
  label,
}: {
  photo: TreatmentPhoto;
  label?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPhotoUrl(photo.storage_path).then((signedUrl) => {
      setUrl(signedUrl);
      setLoading(false);
    });
  }, [photo.storage_path]);

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      {label && (
        <div className="px-2 py-1 bg-primary/10">
          <span className="text-xs font-medium text-primary">{label}</span>
        </div>
      )}
      {loading ? (
        <div className="aspect-square flex items-center justify-center text-text-light text-sm">
          読み込み中...
        </div>
      ) : url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt={label ?? "施術写真"}
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
