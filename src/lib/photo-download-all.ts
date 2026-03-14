/** サロン全写真を一括ダウンロード（JSZipは動的インポート: バンドルサイズ削減） */
import { createClient } from "@/lib/supabase/client";
import { PHOTO_TYPE_LABELS, downloadCustomerPhotosAsZip } from "@/lib/photo-download";

const BULK_THRESHOLD = 200; // これ以下なら1つのZIP、超えたら顧客ごと分割

export type AllPhotosProgress =
  | { phase: "preparing" }
  | { phase: "downloading"; current: number; total: number }
  | { phase: "customer"; customerName: string; currentCustomer: number; totalCustomers: number }
  | { phase: "zipping" };

export async function downloadAllPhotosAsZip(
  salonId: string,
  onProgress?: (p: AllPhotosProgress) => void,
): Promise<{ error?: string }> {
  const supabase = createClient();
  onProgress?.({ phase: "preparing" });

  // 1. 全施術レコード取得
  const { data: records, error: recErr } = await supabase
    .from("treatment_records")
    .select("id, treatment_date, customer_id")
    .eq("salon_id", salonId)
    .order("treatment_date", { ascending: true });

  if (recErr) return { error: `施術記録の取得に失敗: ${recErr.message}` };
  if (!records || records.length === 0) return { error: "施術記録がありません" };

  const recordIds = records.map((r) => r.id);

  // 2. 全写真取得
  const { data: photos, error: photoErr } = await supabase
    .from("treatment_photos")
    .select("storage_path, photo_type, treatment_record_id")
    .in("treatment_record_id", recordIds);

  if (photoErr) return { error: `写真データの取得に失敗: ${photoErr.message}` };
  if (!photos || photos.length === 0) return { error: "ダウンロードできる写真がありません" };

  // 3. 顧客名マップ作成
  const customerIds = [...new Set(records.map((r) => r.customer_id).filter(Boolean))];
  const { data: customers } = await supabase
    .from("customers")
    .select("id, last_name, first_name")
    .eq("salon_id", salonId)
    .in("id", customerIds);

  const customerNameMap = new Map<string, string>();
  for (const c of customers ?? []) {
    customerNameMap.set(c.id, [c.last_name, c.first_name].filter(Boolean).join(" ") || "不明");
  }

  // レコード→顧客IDマップ
  const recordCustomerMap = new Map<string, string>();
  const recordDateMap = new Map<string, string>();
  for (const r of records) {
    if (r.customer_id) recordCustomerMap.set(r.id, r.customer_id);
    recordDateMap.set(r.id, r.treatment_date);
  }

  // 4. 枚数で分岐
  if (photos.length <= BULK_THRESHOLD) {
    return downloadBulk(supabase, photos, recordDateMap, recordCustomerMap, customerNameMap, onProgress);
  } else {
    return downloadByCustomer(salonId, photos, recordCustomerMap, customerNameMap, onProgress);
  }
}

/** 200枚以下: 1つのZIPにまとめる */
async function downloadBulk(
  supabase: ReturnType<typeof createClient>,
  photos: { storage_path: string; photo_type: string; treatment_record_id: string }[],
  recordDateMap: Map<string, string>,
  recordCustomerMap: Map<string, string>,
  customerNameMap: Map<string, string>,
  onProgress?: (p: AllPhotosProgress) => void,
): Promise<{ error?: string }> {
  // Signed URL一括取得
  const paths = photos.map((p) => p.storage_path);
  const { data: signedData } = await supabase.storage
    .from("treatment-photos")
    .createSignedUrls(paths, 3600);

  if (!signedData) return { error: "写真URLの生成に失敗しました" };

  const urlMap = new Map<string, string>();
  for (const item of signedData) {
    if (item.signedUrl && item.path) urlMap.set(item.path, item.signedUrl);
  }

  // ファイルパス事前計算
  const counters = new Map<string, number>();
  const photoEntries = photos.map((photo) => {
    const customerId = recordCustomerMap.get(photo.treatment_record_id);
    const customerName = customerId ? (customerNameMap.get(customerId) ?? "不明") : "不明";
    const date = recordDateMap.get(photo.treatment_record_id) ?? "不明";
    const typeLabel = PHOTO_TYPE_LABELS[photo.photo_type] ?? photo.photo_type;
    const counterKey = `${customerName}/${date}/${typeLabel}`;
    const count = (counters.get(counterKey) ?? 0) + 1;
    counters.set(counterKey, count);
    return {
      storage_path: photo.storage_path,
      filePath: `${customerName}/${date}/${typeLabel}_${count}.jpg`,
      url: urlMap.get(photo.storage_path),
    };
  });

  // ZIP生成
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const today = new Date().toISOString().slice(0, 10);
  const root = zip.folder(`全写真_${today}`)!;

  let completed = 0;
  const total = photoEntries.length;

  await Promise.all(
    photoEntries.map(async (entry) => {
      if (!entry.url) return;
      try {
        const response = await fetch(entry.url);
        const blob = await response.blob();
        root.file(entry.filePath, blob);
      } catch {
        console.error(`写真の取得に失敗: ${entry.storage_path}`);
      }
      completed++;
      onProgress?.({ phase: "downloading", current: completed, total });
    }),
  );

  onProgress?.({ phase: "zipping" });
  const content = await zip.generateAsync({ type: "blob" });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `全写真_${today}.zip`;
  a.click();
  URL.revokeObjectURL(downloadUrl);

  return {};
}

/** 200枚超: 顧客ごとに順次DL */
async function downloadByCustomer(
  salonId: string,
  photos: { storage_path: string; photo_type: string; treatment_record_id: string }[],
  recordCustomerMap: Map<string, string>,
  customerNameMap: Map<string, string>,
  onProgress?: (p: AllPhotosProgress) => void,
): Promise<{ error?: string }> {
  // 写真がある顧客をリストアップ
  const customerIdsWithPhotos = new Set<string>();
  for (const p of photos) {
    const cid = recordCustomerMap.get(p.treatment_record_id);
    if (cid) customerIdsWithPhotos.add(cid);
  }

  const customerList = [...customerIdsWithPhotos].map((id) => ({
    id,
    name: customerNameMap.get(id) ?? "不明",
  }));

  const totalCustomers = customerList.length;
  const errors: string[] = [];

  for (let i = 0; i < customerList.length; i++) {
    const customer = customerList[i];
    onProgress?.({
      phase: "customer",
      customerName: customer.name,
      currentCustomer: i + 1,
      totalCustomers,
    });

    const result = await downloadCustomerPhotosAsZip(customer.id, salonId, customer.name);
    if (result.error) {
      errors.push(`${customer.name}: ${result.error}`);
    }
  }

  if (errors.length > 0 && errors.length === totalCustomers) {
    return { error: "すべての顧客の写真ダウンロードに失敗しました" };
  }
  return {};
}
