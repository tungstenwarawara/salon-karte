import { createClient } from "./client";
import type { PhotoEntry } from "@/components/records/photo-upload";

// --- セキュリティ: 許可するファイルタイプとサイズ上限 ---
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB（スマホの高画質写真に対応）

// ファイルの先頭バイトでマジックナンバーを検証（拡張子偽装を防止）
const MAGIC_NUMBERS: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  // HEIC/HEIF は ftyp ボックスで識別（オフセット4から）
];

async function validateFileType(file: File): Promise<boolean> {
  // 1. MIMEタイプチェック
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return false;
  }

  // 2. マジックナンバーチェック（ファイル先頭バイトで実際の形式を検証）
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const header = new Uint8Array(buffer);

    // HEIC/HEIF: オフセット4から "ftyp" があるか
    if (file.type === "image/heic" || file.type === "image/heif") {
      const ftypStr = String.fromCharCode(...header.slice(4, 8));
      return ftypStr === "ftyp";
    }

    // その他の画像: 先頭バイト照合
    return MAGIC_NUMBERS.some(({ bytes }) =>
      bytes.every((byte, i) => header[i] === byte)
    );
  } catch {
    return false;
  }
}

// EXIF情報を除去してプライバシーを保護（位置情報・デバイス情報の漏洩防止）
async function stripExif(file: File): Promise<File> {
  // JPEG のみ EXIF 除去を行う（PNG/WebPにはEXIFは通常含まれない）
  if (file.type !== "image/jpeg") {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // Canvas に描画して EXIF を除去した新しい画像を生成
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file); // Canvas取得に失敗した場合は元ファイルを返す
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            // EXIF除去済みの新しいFileオブジェクトを生成
            const cleanFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(cleanFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.92 // 高画質を維持
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // 読み込みエラー時は元ファイルを返す
    };

    img.src = url;
  });
}

// MIME→拡張子のマッピング（安全な拡張子を MIME タイプから決定して拡張子偽装を防ぐ）
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/** 1枚の写真を検証 → EXIF除去 → アップロード → DB登録 */
async function uploadSinglePhoto(
  supabase: ReturnType<typeof createClient>,
  recordId: string,
  salonId: string,
  photo: PhotoEntry,
  index: number
): Promise<string | null> {
  // セキュリティ検証1: ファイルサイズチェック
  if (photo.file.size > MAX_FILE_SIZE) {
    const sizeMB = Math.round(photo.file.size / 1024 / 1024);
    return `ファイルサイズが大きすぎます（${sizeMB}MB）。20MB以下の画像をお使いください。`;
  }

  // セキュリティ検証2: ファイルタイプの検証（マジックナンバー検証含む）
  const isValid = await validateFileType(photo.file);
  if (!isValid) {
    return `対応していないファイル形式です。JPEG, PNG, WebP, HEIC形式の画像をお使いください。`;
  }

  // セキュリティ処理: EXIF情報を除去（位置情報・デバイス情報の漏洩防止）
  const cleanFile = await stripExif(photo.file);

  const ext = MIME_TO_EXT[cleanFile.type] || "jpg";
  // index を付けてファイル名の衝突を防止（並列アップロード時にDate.now()が同一になるため）
  const path = `${salonId}/${recordId}/${photo.type}_${Date.now()}_${index}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("treatment-photos")
    .upload(path, cleanFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: cleanFile.type,
    });

  if (uploadError) {
    return `写真のアップロードに失敗しました: ${uploadError.message}`;
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
    return `写真情報の保存に失敗しました: ${dbError.message}`;
  }

  return null; // 成功
}

export async function uploadPhotos(
  recordId: string,
  salonId: string,
  photos: PhotoEntry[]
) {
  const supabase = createClient();

  // P4: 全写真を並列アップロード（逐次 → 並列で3〜4秒改善）
  const results = await Promise.allSettled(
    photos.map((photo, index) =>
      uploadSinglePhoto(supabase, recordId, salonId, photo, index)
    )
  );

  const errors: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      errors.push(result.value);
    } else if (result.status === "rejected") {
      errors.push(`写真のアップロード中にエラーが発生しました`);
    }
  }

  return { errors };
}

export { MAX_FILE_SIZE, ALLOWED_MIME_TYPES };

export async function getPhotoUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from("treatment-photos")
    .createSignedUrl(storagePath, 3600); // 1時間有効

  return data?.signedUrl ?? null;
}

export async function deletePhoto(photoId: string, storagePath: string) {
  const supabase = createClient();

  // DB レコードを先に削除（参照整合性を優先）
  const { error: dbError } = await supabase
    .from("treatment_photos")
    .delete()
    .eq("id", photoId);

  if (dbError) {
    throw new Error(`写真の削除に失敗しました: ${dbError.message}`);
  }

  // ストレージからファイル削除（失敗してもDB側は既に削除済み）
  const { error: storageError } = await supabase.storage
    .from("treatment-photos")
    .remove([storagePath]);

  if (storageError) {
    console.error("Storage delete failed (orphaned file):", storageError.message);
  }
}
