import { createClient } from "./client";
import type { PhotoEntry } from "@/components/records/photo-upload";

export async function uploadPhotos(
  recordId: string,
  salonId: string,
  photos: PhotoEntry[]
) {
  const supabase = createClient();
  const errors: string[] = [];

  for (const photo of photos) {
    const ext = photo.file.name.split(".").pop() || "jpg";
    const path = `${salonId}/${recordId}/${photo.type}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("treatment-photos")
      .upload(path, photo.file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      errors.push(`写真のアップロードに失敗しました: ${uploadError.message}`);
      continue;
    }

    const { error: dbError } = await supabase
      .from("treatment_photos")
      .insert({
        treatment_record_id: recordId,
        storage_path: path,
        photo_type: photo.type,
        memo: photo.memo || null,
      });

    if (dbError) {
      errors.push(`写真情報の保存に失敗しました: ${dbError.message}`);
    }
  }

  return { errors };
}

export async function getPhotoUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from("treatment-photos")
    .createSignedUrl(storagePath, 3600); // 1時間有効

  return data?.signedUrl ?? null;
}

export async function deletePhoto(photoId: string, storagePath: string) {
  const supabase = createClient();

  await supabase.storage.from("treatment-photos").remove([storagePath]);
  await supabase.from("treatment_photos").delete().eq("id", photoId);
}
