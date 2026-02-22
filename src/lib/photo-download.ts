/** 顧客の全施術写真をZIPでダウンロード */
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/client";

const PHOTO_TYPE_LABELS: Record<string, string> = {
  before: "施術前",
  after: "施術後",
};

export async function downloadCustomerPhotosAsZip(
  customerId: string,
  salonId: string,
  customerName: string,
  onProgress?: (current: number, total: number) => void,
): Promise<{ error?: string }> {
  const supabase = createClient();

  // 1. この顧客の全施術レコードを取得（salon_idフィルタ必須）
  const { data: records, error: recErr } = await supabase
    .from("treatment_records")
    .select("id, treatment_date")
    .eq("customer_id", customerId)
    .eq("salon_id", salonId)
    .order("treatment_date", { ascending: true });

  if (recErr) return { error: `施術記録の取得に失敗しました: ${recErr.message}` };
  if (!records || records.length === 0) return { error: "施術記録がありません" };

  const recordIds = records.map((r) => r.id);
  const recordDateMap = new Map(records.map((r) => [r.id, r.treatment_date]));

  // 2. 全写真レコードを取得
  const { data: photos, error: photoErr } = await supabase
    .from("treatment_photos")
    .select("storage_path, photo_type, treatment_record_id")
    .in("treatment_record_id", recordIds);

  if (photoErr) return { error: `写真データの取得に失敗しました: ${photoErr.message}` };
  if (!photos || photos.length === 0) return { error: "ダウンロードできる写真がありません" };

  // 3. Signed URLを一括取得
  const paths = photos.map((p) => p.storage_path);
  const { data: signedData } = await supabase.storage
    .from("treatment-photos")
    .createSignedUrls(paths, 3600);

  if (!signedData) return { error: "写真URLの生成に失敗しました" };

  const urlMap = new Map<string, string>();
  for (const item of signedData) {
    if (item.signedUrl && item.path) {
      urlMap.set(item.path, item.signedUrl);
    }
  }

  // 4. ファイルパスを同期的に事前計算（レースコンディション回避）
  const counters = new Map<string, number>();
  const photoEntries = photos.map((photo) => {
    const date = recordDateMap.get(photo.treatment_record_id) ?? "不明";
    const typeLabel = PHOTO_TYPE_LABELS[photo.photo_type] ?? photo.photo_type;
    const counterKey = `${date}/${typeLabel}`;
    const count = (counters.get(counterKey) ?? 0) + 1;
    counters.set(counterKey, count);
    return {
      storage_path: photo.storage_path,
      fileName: `${date}/${typeLabel}_${count}.jpg`,
      url: urlMap.get(photo.storage_path),
    };
  });

  // 5. ZIP生成 + 写真取得
  const zip = new JSZip();
  const folderName = `${customerName}_写真`;
  const root = zip.folder(folderName)!;

  let completed = 0;
  const total = photoEntries.length;

  await Promise.all(
    photoEntries.map(async (entry) => {
      if (!entry.url) return;
      try {
        const response = await fetch(entry.url);
        const blob = await response.blob();
        root.file(entry.fileName, blob);
      } catch {
        console.error(`写真の取得に失敗: ${entry.storage_path}`);
      }
      completed++;
      onProgress?.(completed, total);
    }),
  );

  // 6. ZIPをブラウザでダウンロード
  const content = await zip.generateAsync({ type: "blob" });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `${customerName}_写真.zip`;
  a.click();
  URL.revokeObjectURL(downloadUrl);

  return {};
}
