import type { Database } from "@/types/database";

type TreatmentPhoto = Database["public"]["Tables"]["treatment_photos"]["Row"];

export function PhotoGroup({
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
