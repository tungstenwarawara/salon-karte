/**
 * Hero 用フリー素材を salon-hp-photos バケットへアップロード
 * 出典: Unsplash (Photo by hani izza)
 *  https://unsplash.com/photos/1645654731316-a350fdcf3bae
 *  Unsplash License (商用利用可、クレジット任意)
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const SALON_ID = "00000000-0000-0000-0000-000000000001";
const BUCKET = "salon-hp-photos";

const UPLOADS = [
  ["/tmp/unsplash-test/hero-silk.jpg", "hero-silk.jpg"],
  ["/tmp/unsplash-test/moment-candle.jpg", "moment-candle.jpg"],
  ["/tmp/unsplash-test/reserve-door.jpg", "reserve-door.jpg"],
];

async function main() {
  for (const [local, name] of UPLOADS) {
    if (!fs.existsSync(local)) {
      console.log(`skip (not found): ${local}`);
      continue;
    }
    const dest = `${SALON_ID}/${name}`;
    const buf = fs.readFileSync(local);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(dest, buf, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "31536000",
      });
    if (error) {
      console.error(`fail ${name}: ${error.message}`);
    } else {
      console.log(`uploaded: ${dest} (${(buf.length / 1024).toFixed(0)}KB)`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
