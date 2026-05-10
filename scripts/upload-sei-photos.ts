/**
 * SEI様HP用画像をsalon-hp-photosバケットにアップロード
 *
 * Usage: npx tsx scripts/upload-sei-photos.ts
 *
 * - /tmp/sei-hp-audit/processed/ の8枚を読み込み
 * - 既存の interior-decor.jpg / interior-salon.jpg はそのまま流用（再アップロード不要）
 * - 不要な古い画像は削除（before-after 5枚, gallery 2枚, owner-profile, products-*, treatment-*, interior-private-room, interior-dressing）
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const SALON_ID = "00000000-0000-0000-0000-000000000001";
const BUCKET = "salon-hp-photos";
const SRC_DIR = "/tmp/sei-hp-audit/processed";

// アップロード対象: 加工済み8枚
const UPLOADS: { src: string; dest: string }[] = [
  { src: "owner-main.jpg", dest: "owner-main.jpg" },
  { src: "owner-sub.jpg", dest: "owner-sub.jpg" },
  { src: "interior-treatment-room.jpg", dest: "interior-treatment-room.jpg" },
  { src: "interior-decor-corner.jpg", dest: "interior-decor-corner.jpg" },
  { src: "interior-entrance.jpg", dest: "interior-entrance.jpg" },
  { src: "products-supplements.jpg", dest: "products-supplements.jpg" },
  { src: "products-premium.jpg", dest: "products-premium.jpg" },
  { src: "products-skincare.jpg", dest: "products-skincare.jpg" },
];

// 削除対象: ロゴ焼き込み・販促バナー・低品質
const DELETES = [
  "before-after-01.jpg",
  "before-after-02.jpg",
  "before-after-03.jpg",
  "before-after-04.jpg",
  "before-after-05.jpg",
  "gallery-01.jpg",
  "gallery-02.jpg",
  "owner-profile.jpg",
  "products-homecare.jpg",
  "products-breastcare.jpg",
  "treatment-rf.jpg",
  "treatment-shoulder.jpg",
  "interior-private-room.jpg",
  "interior-dressing.jpg",
];

// 流用（触らない）: interior-decor.jpg / interior-salon.jpg

async function main() {
  console.log("=== SEI HP photo migration ===\n");

  // 1. アップロード
  console.log(`Uploading ${UPLOADS.length} photos...`);
  for (const { src, dest } of UPLOADS) {
    const fullSrc = path.join(SRC_DIR, src);
    if (!fs.existsSync(fullSrc)) {
      console.error(`  ✗ ${src}: source missing`);
      continue;
    }
    const buf = fs.readFileSync(fullSrc);
    const objectPath = `${SALON_ID}/${dest}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buf, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "31536000",
      });
    if (error) {
      console.error(`  ✗ ${dest}: ${error.message}`);
    } else {
      console.log(`  ✓ ${dest}  (${(buf.length / 1024).toFixed(0)}KB)`);
    }
  }

  // 2. 削除
  console.log(`\nDeleting ${DELETES.length} obsolete photos...`);
  const { data: deleted, error: deleteErr } = await supabase.storage
    .from(BUCKET)
    .remove(DELETES.map((f) => `${SALON_ID}/${f}`));
  if (deleteErr) {
    console.error(`  ✗ delete error: ${deleteErr.message}`);
  } else {
    console.log(`  ✓ removed ${deleted?.length ?? 0} files`);
  }

  // 3. 確認
  console.log("\nFinal storage state:");
  const { data: list } = await supabase.storage
    .from(BUCKET)
    .list(SALON_ID, { limit: 100, sortBy: { column: "name", order: "asc" } });
  list?.forEach((f) => {
    const sz = ((f.metadata?.size as number) ?? 0) / 1024;
    console.log(`  ${f.name}  (${sz.toFixed(0)}KB)`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
