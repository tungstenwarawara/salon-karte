/**
 * テストサロン シードデータ投入スクリプト
 *
 * 使い方:
 *   npx tsx scripts/seed-test-data.ts          # 初回作成（既存なら何もしない）
 *   npx tsx scripts/seed-test-data.ts --reset   # テストデータのみ削除→再作成
 *   npx tsx scripts/seed-test-data.ts --check   # 安全チェックのみ実行（DB変更なし）
 *
 * 必要な環境変数（.env.local）:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * 安全装置（多層防御）:
 *   Layer 1: UUID 一致チェック（00000000-0000-0000-0000-000000000001）
 *   Layer 2: owner_id 一致チェック（00000000-0000-0000-0000-000000000099）
 *   Layer 3: オーナーメール完全一致チェック（test-salon@salon-karte.dev）
 *   Layer 4: 本番環境ガード（VERCEL_ENV=production / NODE_ENV=production を拒否）
 *   Layer 5: 透明ログ — 削除前に「保護対象サロン一覧」を全件出力
 *   いずれか1層でも違反すれば即中止。本番データに絶対触れない構造。
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

// .env.local を読み込み
const __dirname2 = typeof __dirname !== "undefined"
  ? __dirname
  : resolve(fileURLToPath(import.meta.url), "..");
config({ path: resolve(__dirname2, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "エラー: NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が .env.local に必要です"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ============================================================
// 固定ID（テストデータ識別用）— このセクションは安全装置の根幹。慎重に変更すること。
// ============================================================
const TEST_SALON_ID = "00000000-0000-0000-0000-000000000001";
const TEST_OWNER_ID = "00000000-0000-0000-0000-000000000099";
const TEST_EMAIL = "test-salon@salon-karte.dev";
const TEST_PASSWORD = "TestSalon2026!";

// スタッフ
const STAFF_OWNER_ID = "00000000-0000-0000-0000-000000000101";
const STAFF_MEMBER_ID = "00000000-0000-0000-0000-000000000102";

// 顧客 (25名)
const customerIds = Array.from(
  { length: 25 },
  (_, i) =>
    `00000000-0000-0000-0000-0000000010${String(i + 1).padStart(2, "0")}`
);

// メニュー (6)
const menuIds = Array.from(
  { length: 6 },
  (_, i) => `00000000-0000-0000-0000-00000000200${i + 1}`
);

// 商品 (5)
const productIds = Array.from(
  { length: 5 },
  (_, i) => `00000000-0000-0000-0000-00000000300${i + 1}`
);

// カルテ (30)
const recordIds = Array.from(
  { length: 30 },
  (_, i) =>
    `00000000-0000-0000-0000-0000000040${String(i + 1).padStart(2, "0")}`
);

// 回数券 (4)
const ticketIds = Array.from(
  { length: 4 },
  (_, i) => `00000000-0000-0000-0000-00000000500${i + 1}`
);

// 予約 (15)
const appointmentIds = Array.from(
  { length: 15 },
  (_, i) =>
    `00000000-0000-0000-0000-0000000060${String(i + 1).padStart(2, "0")}`
);

// 物販 (10)
const purchaseIds = Array.from(
  { length: 10 },
  (_, i) =>
    `00000000-0000-0000-0000-0000000070${String(i + 1).padStart(2, "0")}`
);

// カウンセリング (3)
const counselingIds = Array.from(
  { length: 3 },
  (_, i) => `00000000-0000-0000-0000-00000000800${i + 1}`
);

// ============================================================
// 日付ヘルパー
// ============================================================
const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return fmt(d);
};
const daysLater = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return fmt(d);
};
const monthsAgo = (n: number) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() - n);
  return fmt(d);
};

// ============================================================
// 安全チェック — DB を変更する前に必ず通す
// ============================================================
async function verifySafety(): Promise<{ targetExists: boolean }> {
  console.log("\n[安全チェック] 開始 ─────────────────────────");

  // Layer 4: 本番環境ガード
  if (process.env.VERCEL_ENV === "production") {
    throw new Error(
      "[安全装置] VERCEL_ENV=production を検知。本番環境では実行不可。中止。"
    );
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[安全装置] NODE_ENV=production を検知。本番環境では実行不可。中止。"
    );
  }

  // Layer 5: 全サロン一覧（透明ログ）
  const { data: allSalons, error: listError } = await supabase
    .from("salons")
    .select("id, name, owner_id");
  if (listError) {
    throw new Error(`[安全装置] サロン一覧取得失敗: ${listError.message}`);
  }
  if (!allSalons) {
    throw new Error("[安全装置] サロン一覧が null。中止。");
  }

  const target = allSalons.find((s) => s.id === TEST_SALON_ID);
  const others = allSalons.filter((s) => s.id !== TEST_SALON_ID);

  console.log(`[安全チェック] DB 内サロン総数: ${allSalons.length}件`);
  console.log(`[安全チェック] 削除対象 UUID : ${TEST_SALON_ID}`);
  console.log(`[安全チェック] 保護対象（${others.length}件、絶対に触れない）:`);
  for (const s of others) {
    console.log(`  ✓ ${s.name} (${s.id})`);
  }

  if (!target) {
    console.log("[安全チェック] 削除対象サロンは未作成。新規作成のみ実行。");
    console.log("[安全チェック] OK ───────────────────────────\n");
    return { targetExists: false };
  }

  // Layer 1+2: UUID + owner_id 一致チェック
  if (target.owner_id !== TEST_OWNER_ID) {
    throw new Error(
      `[安全装置] サロン ${TEST_SALON_ID} の owner_id が "${target.owner_id}" でテスト用 "${TEST_OWNER_ID}" と一致しません。本番データの可能性。中止。`
    );
  }

  // Layer 3: オーナーメール完全一致チェック
  const { data: userResp, error: userError } =
    await supabase.auth.admin.getUserById(target.owner_id);
  if (userError || !userResp?.user) {
    throw new Error(
      `[安全装置] オーナー認証ユーザー取得失敗: ${userError?.message ?? "user not found"}`
    );
  }
  if (userResp.user.email !== TEST_EMAIL) {
    throw new Error(
      `[安全装置] オーナーメール "${userResp.user.email}" がテスト用 "${TEST_EMAIL}" と一致しません。中止。`
    );
  }

  console.log(`[安全チェック] 削除対象サロン名: "${target.name}"`);
  console.log(`[安全チェック] 削除対象 owner_id: ${target.owner_id} ✓`);
  console.log(`[安全チェック] 削除対象 email   : ${userResp.user.email} ✓`);
  console.log("[安全チェック] OK ───────────────────────────\n");

  return { targetExists: true };
}

// ============================================================
// メイン処理
// ============================================================
async function main() {
  const isReset = process.argv.includes("--reset");
  const isCheckOnly = process.argv.includes("--check");

  console.log("=== テストサロン シードデータ ===");
  console.log(
    `モード: ${
      isCheckOnly
        ? "CHECK（安全チェックのみ、DB変更なし）"
        : isReset
          ? "RESET（削除→再作成）"
          : "CREATE（初回作成）"
    }`
  );
  console.log(`サロンID: ${TEST_SALON_ID}`);

  // 安全チェック（必ず通す）
  const { targetExists } = await verifySafety();

  if (isCheckOnly) {
    console.log("=== チェックのみで終了（DB は変更されていません） ===");
    return;
  }

  if (targetExists && !isReset) {
    console.log("テストサロンは既に存在します。--reset で再作成できます。");
    return;
  }

  if (targetExists && isReset) {
    console.log("テストサロンを削除中...");
    // 子テーブルから順番に削除（FK制約を尊重）
    await deleteTestData();
    console.log("削除完了");
  }

  // Auth ユーザー作成 or 取得
  const authUserId = await ensureAuthUser();
  console.log(`Auth ユーザーID: ${authUserId}`);

  // データ投入
  await insertSalon(authUserId);
  await insertStaff(authUserId);
  await insertCustomers();
  await insertMenus();
  await insertProducts();
  await insertCourseTickets();
  await insertTreatmentRecords();
  await insertTreatmentRecordMenus();
  await insertAppointments();
  await insertAppointmentMenus();
  await insertPurchases();
  await insertInventoryLogs();
  await insertCounselingSheets();
  await insertStaffMenus();
  await insertStaffScheduleOverrides();

  console.log("\n=== 完了 ===");
  console.log(`メール: ${TEST_EMAIL}`);
  console.log(`パスワード: ${TEST_PASSWORD}`);
  console.log(`サロン名: テストサロン花`);
}

// ============================================================
// Auth ユーザー
// ============================================================
async function ensureAuthUser(): Promise<string> {
  // 既存ユーザーを検索
  const { data: users } = await supabase.auth.admin.listUsers();
  const existing = users?.users?.find((u) => u.email === TEST_EMAIL);
  if (existing) {
    if (existing.id !== TEST_OWNER_ID) {
      throw new Error(
        `[安全装置] 既存 auth ユーザーの id "${existing.id}" がテスト用 "${TEST_OWNER_ID}" と一致しません。` +
          `手動でこのユーザーを削除してから再実行してください。中止。`
      );
    }
    console.log("Auth ユーザー: 既存を使用");
    return existing.id;
  }

  // 新規作成（UUID は Supabase 側で発行されるため事後検証）
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error) {
    console.error("Auth ユーザー作成エラー:", error.message);
    process.exit(1);
  }
  if (data.user.id !== TEST_OWNER_ID) {
    console.warn(
      `[警告] 新規作成 auth ユーザーの id ${data.user.id} は固定値 ${TEST_OWNER_ID} と異なります。` +
        `seed-test-data.ts の TEST_OWNER_ID を更新するか、手動で UUID を揃えてください。`
    );
  }
  console.log("Auth ユーザー: 新規作成");
  return data.user.id;
}

// ============================================================
// 削除（--reset用）
// ============================================================
async function deleteTestData() {
  // 子テーブルから削除（FK制約順）
  const tables = [
    "staff_schedule_overrides",
    "staff_menus",
    "line_message_logs",
    "customer_line_links",
    "salon_line_configs",
    "counseling_sheets",
    "inventory_logs",
    "appointment_menus",
    "treatment_record_menus",
    "treatment_photos",
    "purchases",
    "course_tickets",
    "appointments",
    "treatment_records",
    "products",
    "treatment_menus",
    "import_batches",
    "customers",
    "staff",
    "salons",
  ];

  for (const table of tables) {
    if (table === "salons") {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", TEST_SALON_ID);
      if (error) console.warn(`  ${table} 削除警告: ${error.message}`);
    } else {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("salon_id", TEST_SALON_ID);
      if (error) console.warn(`  ${table} 削除警告: ${error.message}`);
    }
  }
}

// ============================================================
// サロン
// ============================================================
async function insertSalon(authUserId: string) {
  const { error } = await supabase.from("salons").insert({
    id: TEST_SALON_ID,
    owner_id: authUserId,
    name: "テストサロン花",
    phone: "03-1234-5678",
    address: "東京都渋谷区テスト町1-2-3",
    business_hours: {
      monday: { is_open: true, open_time: "10:00", close_time: "20:00" },
      tuesday: { is_open: true, open_time: "10:00", close_time: "20:00" },
      wednesday: { is_open: true, open_time: "10:00", close_time: "20:00" },
      thursday: { is_open: true, open_time: "10:00", close_time: "20:00" },
      friday: { is_open: true, open_time: "10:00", close_time: "20:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "19:00" },
      sunday: { is_open: false, open_time: "10:00", close_time: "20:00" },
    },
    salon_holidays: ["2026-01-01", "2026-01-02", "2026-01-03"],
    booking_settings: { same_day_enabled: true, lead_time_minutes: 60 },
    counseling_template: {
      sections: [
        {
          id: "sec_basic",
          title: "基本情報",
          description: "お客様の基本情報をご記入ください",
          fields: [
            { id: "f_name", label: "お名前", type: "text", required: true },
            { id: "f_age", label: "年齢", type: "text" },
            { id: "f_job", label: "ご職業", type: "text" },
          ],
        },
        {
          id: "sec_skin",
          title: "お肌の状態",
          fields: [
            {
              id: "f_skin_type",
              label: "肌タイプ",
              type: "radio",
              options: ["乾燥肌", "脂性肌", "混合肌", "敏感肌"],
            },
            {
              id: "f_concerns",
              label: "気になるお肌の悩み",
              type: "checkbox",
              options: ["シミ", "シワ", "たるみ", "ニキビ", "毛穴", "くすみ"],
            },
            {
              id: "f_allergy",
              label: "アレルギーや既往歴",
              type: "textarea",
            },
          ],
        },
        {
          id: "sec_goals",
          title: "施術のご希望",
          fields: [
            {
              id: "f_goals",
              label: "施術の目的",
              type: "checkbox",
              options: [
                "リラクゼーション",
                "肌質改善",
                "アンチエイジング",
                "痩身",
                "その他",
              ],
            },
            {
              id: "f_notes",
              label: "その他ご要望",
              type: "textarea",
            },
          ],
        },
      ],
    },
  });
  if (error) throw new Error(`salons: ${error.message}`);
  console.log("salons: 1件");
}

// ============================================================
// スタッフ
// ============================================================
async function insertStaff(authUserId: string) {
  const { error } = await supabase.from("staff").insert([
    {
      id: STAFF_OWNER_ID,
      salon_id: TEST_SALON_ID,
      auth_user_id: authUserId,
      name: "テストオーナー",
      email: TEST_EMAIL,
      role: "owner",
      is_active: true,
      default_schedule: {
        monday: { is_open: true, open_time: "10:00", close_time: "20:00" },
        tuesday: { is_open: true, open_time: "10:00", close_time: "20:00" },
        wednesday: { is_open: true, open_time: "10:00", close_time: "20:00" },
        thursday: { is_open: true, open_time: "10:00", close_time: "20:00" },
        friday: { is_open: true, open_time: "10:00", close_time: "20:00" },
        saturday: { is_open: true, open_time: "10:00", close_time: "19:00" },
        sunday: { is_open: false, open_time: "10:00", close_time: "20:00" },
      },
    },
    {
      id: STAFF_MEMBER_ID,
      salon_id: TEST_SALON_ID,
      auth_user_id: null,
      name: "テストスタッフ",
      email: "test-staff@salon-karte.dev",
      role: "staff",
      is_active: true,
      default_schedule: {
        monday: { is_open: true, open_time: "11:00", close_time: "19:00" },
        tuesday: { is_open: true, open_time: "11:00", close_time: "19:00" },
        wednesday: { is_open: true, open_time: "11:00", close_time: "19:00" },
        thursday: { is_open: true, open_time: "11:00", close_time: "19:00" },
        friday: { is_open: true, open_time: "11:00", close_time: "19:00" },
        saturday: { is_open: false, open_time: "10:00", close_time: "19:00" },
        sunday: { is_open: false, open_time: "10:00", close_time: "20:00" },
      },
    },
  ]);
  if (error) throw new Error(`staff: ${error.message}`);
  console.log("staff: 2件");
}

// ============================================================
// 顧客
// ============================================================
async function insertCustomers() {
  const customers = [
    // 常連（多数のカルテあり）
    { id: customerIds[0], last_name: "山田", first_name: "花子", last_name_kana: "ヤマダ", first_name_kana: "ハナコ", birth_date: "1990-03-15", phone: "090-1111-0001", email: "yamada@test.dev", skin_type: "混合肌", treatment_goal: "肌質改善" },
    { id: customerIds[1], last_name: "佐藤", first_name: "美咲", last_name_kana: "サトウ", first_name_kana: "ミサキ", birth_date: "1985-07-22", phone: "090-1111-0002", email: "sato@test.dev", skin_type: "乾燥肌", treatment_goal: "アンチエイジング" },
    // 誕生月が今月（テスト用）
    { id: customerIds[2], last_name: "田中", first_name: "麻衣", last_name_kana: "タナカ", first_name_kana: "マイ", birth_date: `1992-${String(today.getMonth() + 1).padStart(2, "0")}-14`, phone: "090-1111-0003", email: "tanaka@test.dev", skin_type: "敏感肌" },
    // 離脱（>90日来店なし）
    { id: customerIds[3], last_name: "鈴木", first_name: "由美", last_name_kana: "スズキ", first_name_kana: "ユミ", birth_date: "1988-11-03", phone: "090-1111-0004", skin_type: "脂性肌" },
    // 離脱（>60日来店なし）
    { id: customerIds[4], last_name: "高橋", first_name: "さくら", last_name_kana: "タカハシ", first_name_kana: "サクラ", birth_date: "1995-05-20", phone: "090-1111-0005" },
    // 卒業済み
    { id: customerIds[5], last_name: "伊藤", first_name: "千尋", last_name_kana: "イトウ", first_name_kana: "チヒロ", birth_date: "1982-09-08", phone: "090-1111-0006", graduated_at: daysAgo(30) },
    // 通常顧客（7-25）
    { id: customerIds[6], last_name: "渡辺", first_name: "真由", last_name_kana: "ワタナベ", first_name_kana: "マユ", phone: "090-1111-0007" },
    { id: customerIds[7], last_name: "中村", first_name: "あゆみ", last_name_kana: "ナカムラ", first_name_kana: "アユミ", phone: "090-1111-0008", birth_date: "1993-01-25" },
    { id: customerIds[8], last_name: "小林", first_name: "理恵", last_name_kana: "コバヤシ", first_name_kana: "リエ", phone: "090-1111-0009" },
    { id: customerIds[9], last_name: "加藤", first_name: "美穂", last_name_kana: "カトウ", first_name_kana: "ミホ", phone: "090-1111-0010", skin_type: "混合肌" },
    { id: customerIds[10], last_name: "吉田", first_name: "恵", last_name_kana: "ヨシダ", first_name_kana: "メグミ", phone: "090-1111-0011" },
    { id: customerIds[11], last_name: "山口", first_name: "紗希", last_name_kana: "ヤマグチ", first_name_kana: "サキ", phone: "090-1111-0012", birth_date: "1991-06-10" },
    { id: customerIds[12], last_name: "松本", first_name: "愛", last_name_kana: "マツモト", first_name_kana: "アイ", phone: "090-1111-0013" },
    { id: customerIds[13], last_name: "井上", first_name: "裕子", last_name_kana: "イノウエ", first_name_kana: "ユウコ", phone: "090-1111-0014", allergies: "金属アレルギー" },
    { id: customerIds[14], last_name: "木村", first_name: "明日香", last_name_kana: "キムラ", first_name_kana: "アスカ", phone: "090-1111-0015" },
    { id: customerIds[15], last_name: "林", first_name: "奈々", last_name_kana: "ハヤシ", first_name_kana: "ナナ", phone: "090-1111-0016", birth_date: "1994-12-01" },
    { id: customerIds[16], last_name: "清水", first_name: "彩", last_name_kana: "シミズ", first_name_kana: "アヤ", phone: "090-1111-0017" },
    { id: customerIds[17], last_name: "山崎", first_name: "瞳", last_name_kana: "ヤマザキ", first_name_kana: "ヒトミ", phone: "090-1111-0018" },
    { id: customerIds[18], last_name: "森", first_name: "美月", last_name_kana: "モリ", first_name_kana: "ミヅキ", phone: "090-1111-0019", skin_type: "乾燥肌" },
    { id: customerIds[19], last_name: "池田", first_name: "春菜", last_name_kana: "イケダ", first_name_kana: "ハルナ", phone: "090-1111-0020" },
    { id: customerIds[20], last_name: "橋本", first_name: "里奈", last_name_kana: "ハシモト", first_name_kana: "リナ", phone: "090-1111-0021" },
    { id: customerIds[21], last_name: "阿部", first_name: "真央", last_name_kana: "アベ", first_name_kana: "マオ", phone: "090-1111-0022", birth_date: "1989-08-18" },
    { id: customerIds[22], last_name: "石川", first_name: "葵", last_name_kana: "イシカワ", first_name_kana: "アオイ", phone: "090-1111-0023" },
    { id: customerIds[23], last_name: "前田", first_name: "優花", last_name_kana: "マエダ", first_name_kana: "ユウカ", phone: "090-1111-0024" },
    { id: customerIds[24], last_name: "藤田", first_name: "莉子", last_name_kana: "フジタ", first_name_kana: "リコ", phone: "090-1111-0025", notes: "カウンセリング希望" },
  ];

  const { error } = await supabase
    .from("customers")
    .insert(customers.map((c) => ({ ...c, salon_id: TEST_SALON_ID })));
  if (error) throw new Error(`customers: ${error.message}`);
  console.log(`customers: ${customers.length}件`);
}

// ============================================================
// 施術メニュー
// ============================================================
async function insertMenus() {
  const menus = [
    { id: menuIds[0], name: "フェイシャルベーシック", category: "フェイシャル", duration_minutes: 60, price: 8000, is_active: true },
    { id: menuIds[1], name: "フェイシャルプレミアム", category: "フェイシャル", duration_minutes: 90, price: 12000, is_active: true },
    { id: menuIds[2], name: "ボディリラクゼーション", category: "ボディ", duration_minutes: 60, price: 7000, is_active: true },
    { id: menuIds[3], name: "デコルテケア", category: "ボディ", duration_minutes: 30, price: 4000, is_active: true },
    { id: menuIds[4], name: "ヘッドスパ", category: "リラクゼーション", duration_minutes: 40, price: 5000, is_active: true },
    { id: menuIds[5], name: "旧フェイシャル（終了）", category: "フェイシャル", duration_minutes: 60, price: 6000, is_active: false },
  ];

  const { error } = await supabase
    .from("treatment_menus")
    .insert(menus.map((m) => ({ ...m, salon_id: TEST_SALON_ID })));
  if (error) throw new Error(`treatment_menus: ${error.message}`);
  console.log(`treatment_menus: ${menus.length}件`);
}

// ============================================================
// 商品
// ============================================================
async function insertProducts() {
  const products = [
    { id: productIds[0], name: "モイスチャーローション", category: "スキンケア", base_sell_price: 4500, base_cost_price: 2000, reorder_point: 5 },
    { id: productIds[1], name: "リッチクリーム", category: "スキンケア", base_sell_price: 6800, base_cost_price: 3000, reorder_point: 3 },
    { id: productIds[2], name: "クレンジングオイル", category: "スキンケア", base_sell_price: 3200, base_cost_price: 1400, reorder_point: 5 },
    { id: productIds[3], name: "UVプロテクトミルク", category: "サンケア", base_sell_price: 2800, base_cost_price: 1200, reorder_point: 3 },
    { id: productIds[4], name: "ボディオイル", category: "ボディケア", base_sell_price: 5500, base_cost_price: 2400, reorder_point: 3 },
  ];

  const { error } = await supabase
    .from("products")
    .insert(products.map((p) => ({ ...p, salon_id: TEST_SALON_ID })));
  if (error) throw new Error(`products: ${error.message}`);
  console.log(`products: ${products.length}件`);
}

// ============================================================
// 回数券
// ============================================================
async function insertCourseTickets() {
  const tickets = [
    { id: ticketIds[0], customer_id: customerIds[1], ticket_name: "フェイシャルベーシック5回", total_sessions: 5, used_sessions: 3, purchase_date: monthsAgo(2), expiry_date: daysLater(180), price: 35000, status: "active" },
    { id: ticketIds[1], customer_id: customerIds[0], ticket_name: "ボディリラクゼーション10回", total_sessions: 10, used_sessions: 0, purchase_date: daysAgo(7), expiry_date: daysLater(365), price: 60000, status: "active" },
    { id: ticketIds[2], customer_id: customerIds[0], ticket_name: "フェイシャルプレミアム5回", total_sessions: 5, used_sessions: 5, purchase_date: monthsAgo(6), expiry_date: daysLater(90), price: 50000, status: "completed" },
    { id: ticketIds[3], customer_id: customerIds[3], ticket_name: "ヘッドスパ3回", total_sessions: 3, used_sessions: 1, purchase_date: monthsAgo(8), expiry_date: daysAgo(60), price: 12000, status: "expired" },
  ];

  const { error } = await supabase
    .from("course_tickets")
    .insert(tickets.map((t) => ({ ...t, salon_id: TEST_SALON_ID })));
  if (error) throw new Error(`course_tickets: ${error.message}`);
  console.log(`course_tickets: ${tickets.length}件`);
}

// ============================================================
// カルテ（施術記録）
// ============================================================
async function insertTreatmentRecords() {
  const records = [];

  // 山田花子: 10件（今月5, 先月3, 2ヶ月前2）
  for (let i = 0; i < 5; i++) {
    records.push({
      id: recordIds[i],
      customer_id: customerIds[0],
      staff_id: STAFF_OWNER_ID,
      treatment_date: daysAgo(i * 3),
      skin_condition_before: "やや乾燥気味",
      notes_after: `施術後の経過良好（${i + 1}回目）`,
      next_visit_memo: "2週間後に来店予定",
    });
  }
  for (let i = 0; i < 3; i++) {
    records.push({
      id: recordIds[5 + i],
      customer_id: customerIds[0],
      staff_id: STAFF_OWNER_ID,
      treatment_date: daysAgo(30 + i * 5),
      skin_condition_before: "混合肌、Tゾーンのテカリ",
      notes_after: "保湿ケアを重点的に実施",
    });
  }
  for (let i = 0; i < 2; i++) {
    records.push({
      id: recordIds[8 + i],
      customer_id: customerIds[0],
      staff_id: STAFF_MEMBER_ID,
      treatment_date: daysAgo(60 + i * 7),
      skin_condition_before: "季節の変わり目で荒れ気味",
    });
  }

  // 佐藤美咲: 5件
  for (let i = 0; i < 5; i++) {
    records.push({
      id: recordIds[10 + i],
      customer_id: customerIds[1],
      staff_id: STAFF_OWNER_ID,
      treatment_date: daysAgo(i * 14),
      skin_condition_before: "乾燥がやや目立つ",
      notes_after: "保湿パックを追加",
      conversation_notes: "お仕事が忙しいとのこと",
    });
  }

  // 田中麻衣: 3件
  for (let i = 0; i < 3; i++) {
    records.push({
      id: recordIds[15 + i],
      customer_id: customerIds[2],
      staff_id: STAFF_OWNER_ID,
      treatment_date: daysAgo(i * 21),
      skin_condition_before: "敏感肌、赤みあり",
      caution_notes: "強い成分は避ける",
    });
  }

  // 鈴木由美（離脱）: 2件（90日以上前）
  records.push({
    id: recordIds[18],
    customer_id: customerIds[3],
    staff_id: STAFF_OWNER_ID,
    treatment_date: daysAgo(100),
    skin_condition_before: "脂性肌",
  });
  records.push({
    id: recordIds[19],
    customer_id: customerIds[3],
    staff_id: STAFF_OWNER_ID,
    treatment_date: daysAgo(120),
  });

  // 高橋さくら（離脱60日）: 1件
  records.push({
    id: recordIds[20],
    customer_id: customerIds[4],
    staff_id: STAFF_MEMBER_ID,
    treatment_date: daysAgo(65),
  });

  // その他の顧客: 9件
  for (let i = 0; i < 9; i++) {
    records.push({
      id: recordIds[21 + i],
      customer_id: customerIds[6 + i],
      staff_id: i % 2 === 0 ? STAFF_OWNER_ID : STAFF_MEMBER_ID,
      treatment_date: daysAgo(i * 4 + 2),
      notes_after: "問題なし",
    });
  }

  const { error } = await supabase
    .from("treatment_records")
    .insert(records.map((r) => ({ ...r, salon_id: TEST_SALON_ID })));
  if (error) throw new Error(`treatment_records: ${error.message}`);
  console.log(`treatment_records: ${records.length}件`);
}

// ============================================================
// カルテメニュー中間テーブル
// ============================================================
async function insertTreatmentRecordMenus() {
  const items: Array<{
    treatment_record_id: string;
    menu_id: string;
    menu_name_snapshot: string;
    price_snapshot: number;
    duration_minutes_snapshot: number;
    payment_type: "cash" | "credit" | "ticket" | "service";
    ticket_id: string | null;
    sort_order: number;
  }> = [];
  let idCounter = 1;
  const genId = () =>
    `00000000-0000-0000-0000-000000009${String(idCounter++).padStart(3, "0")}`;

  // 山田花子のカルテ（cash/credit/ticket/service混在）
  for (let i = 0; i < 10; i++) {
    const paymentTypes: Array<"cash" | "credit" | "ticket" | "service"> = [
      "cash", "cash", "credit", "cash", "ticket",
      "cash", "credit", "cash", "service", "cash",
    ];
    items.push({
      treatment_record_id: recordIds[i],
      menu_id: menuIds[i % 5],
      menu_name_snapshot: ["フェイシャルベーシック", "フェイシャルプレミアム", "ボディリラクゼーション", "デコルテケア", "ヘッドスパ"][i % 5],
      price_snapshot: [8000, 12000, 7000, 4000, 5000][i % 5],
      duration_minutes_snapshot: [60, 90, 60, 30, 40][i % 5],
      payment_type: paymentTypes[i],
      ticket_id: paymentTypes[i] === "ticket" ? ticketIds[1] : null,
      sort_order: 0,
    });
    // 一部のカルテに2つ目のメニュー
    if (i < 3) {
      items.push({
        treatment_record_id: recordIds[i],
        menu_id: menuIds[3],
        menu_name_snapshot: "デコルテケア",
        price_snapshot: 4000,
        duration_minutes_snapshot: 30,
        payment_type: "cash",
        ticket_id: null,
        sort_order: 1,
      });
    }
  }

  // 佐藤美咲（回数券利用含む）
  for (let i = 0; i < 5; i++) {
    items.push({
      treatment_record_id: recordIds[10 + i],
      menu_id: menuIds[0],
      menu_name_snapshot: "フェイシャルベーシック",
      price_snapshot: 8000,
      duration_minutes_snapshot: 60,
      payment_type: i < 3 ? "ticket" : "cash",
      ticket_id: i < 3 ? ticketIds[0] : null,
      sort_order: 0,
    });
  }

  // 田中麻衣
  for (let i = 0; i < 3; i++) {
    items.push({
      treatment_record_id: recordIds[15 + i],
      menu_id: menuIds[4],
      menu_name_snapshot: "ヘッドスパ",
      price_snapshot: 5000,
      duration_minutes_snapshot: 40,
      payment_type: "cash",
      ticket_id: null,
      sort_order: 0,
    });
  }

  // 鈴木由美（回数券1回分）
  items.push({
    treatment_record_id: recordIds[18],
    menu_id: menuIds[4],
    menu_name_snapshot: "ヘッドスパ",
    price_snapshot: 5000,
    duration_minutes_snapshot: 40,
    payment_type: "ticket",
    ticket_id: ticketIds[3],
    sort_order: 0,
  });

  // 残りのカルテ
  for (let i = 19; i < 30; i++) {
    if (i === 18) continue; // 鈴木由美は上で処理済み
    items.push({
      treatment_record_id: recordIds[i],
      menu_id: menuIds[i % 5],
      menu_name_snapshot: ["フェイシャルベーシック", "フェイシャルプレミアム", "ボディリラクゼーション", "デコルテケア", "ヘッドスパ"][i % 5],
      price_snapshot: [8000, 12000, 7000, 4000, 5000][i % 5],
      duration_minutes_snapshot: [60, 90, 60, 30, 40][i % 5],
      payment_type: "cash",
      ticket_id: null,
      sort_order: 0,
    });
  }

  const { error } = await supabase
    .from("treatment_record_menus")
    .insert(items.map((item) => ({ id: genId(), ...item })));
  if (error) throw new Error(`treatment_record_menus: ${error.message}`);
  console.log(`treatment_record_menus: ${items.length}件`);
}

// ============================================================
// 予約
// ============================================================
async function insertAppointments() {
  const appointments = [
    // 今日 3件
    { id: appointmentIds[0], customer_id: customerIds[0], appointment_date: fmt(today), start_time: "10:00", end_time: "11:00", status: "scheduled", staff_id: STAFF_OWNER_ID, memo: "いつものケア" },
    { id: appointmentIds[1], customer_id: customerIds[1], appointment_date: fmt(today), start_time: "13:00", end_time: "14:30", status: "scheduled", staff_id: STAFF_OWNER_ID },
    { id: appointmentIds[2], customer_id: customerIds[6], appointment_date: fmt(today), start_time: "15:00", end_time: "16:00", status: "scheduled", staff_id: STAFF_MEMBER_ID },
    // 明日 2件
    { id: appointmentIds[3], customer_id: customerIds[2], appointment_date: daysLater(1), start_time: "11:00", end_time: "12:00", status: "scheduled", staff_id: STAFF_OWNER_ID },
    { id: appointmentIds[4], customer_id: customerIds[7], appointment_date: daysLater(1), start_time: "14:00", end_time: "15:00", status: "scheduled", staff_id: STAFF_MEMBER_ID },
    // 過去 完了 5件
    { id: appointmentIds[5], customer_id: customerIds[0], appointment_date: daysAgo(1), start_time: "10:00", end_time: "11:00", status: "completed", staff_id: STAFF_OWNER_ID, treatment_record_id: recordIds[0] },
    { id: appointmentIds[6], customer_id: customerIds[1], appointment_date: daysAgo(3), start_time: "13:00", end_time: "14:00", status: "completed", staff_id: STAFF_OWNER_ID, treatment_record_id: recordIds[10] },
    { id: appointmentIds[7], customer_id: customerIds[8], appointment_date: daysAgo(5), start_time: "11:00", end_time: "12:30", status: "completed", staff_id: STAFF_MEMBER_ID, treatment_record_id: recordIds[23] },
    { id: appointmentIds[8], customer_id: customerIds[9], appointment_date: daysAgo(7), start_time: "15:00", end_time: "16:00", status: "completed", staff_id: STAFF_OWNER_ID, treatment_record_id: recordIds[24] },
    { id: appointmentIds[9], customer_id: customerIds[10], appointment_date: daysAgo(10), start_time: "10:00", end_time: "11:30", status: "completed", staff_id: STAFF_OWNER_ID, treatment_record_id: recordIds[25] },
    // 過去 完了 3件
    { id: appointmentIds[10], customer_id: customerIds[11], appointment_date: daysAgo(14), start_time: "13:00", end_time: "14:00", status: "completed", staff_id: STAFF_OWNER_ID, treatment_record_id: recordIds[26] },
    { id: appointmentIds[11], customer_id: customerIds[12], appointment_date: daysAgo(21), start_time: "11:00", end_time: "12:00", status: "completed", staff_id: STAFF_MEMBER_ID, treatment_record_id: recordIds[27] },
    { id: appointmentIds[12], customer_id: customerIds[13], appointment_date: daysAgo(28), start_time: "14:00", end_time: "15:30", status: "completed", staff_id: STAFF_OWNER_ID, treatment_record_id: recordIds[28] },
    // キャンセル 2件
    { id: appointmentIds[13], customer_id: customerIds[14], appointment_date: daysAgo(2), start_time: "16:00", end_time: "17:00", status: "cancelled", staff_id: STAFF_OWNER_ID, memo: "体調不良のため" },
    { id: appointmentIds[14], customer_id: customerIds[15], appointment_date: daysAgo(4), start_time: "10:00", end_time: "11:00", status: "cancelled", staff_id: STAFF_MEMBER_ID },
  ];

  const { error } = await supabase
    .from("appointments")
    .insert(appointments.map((a) => ({ ...a, salon_id: TEST_SALON_ID })));
  if (error) throw new Error(`appointments: ${error.message}`);
  console.log(`appointments: ${appointments.length}件`);
}

// ============================================================
// 予約メニュー中間テーブル
// ============================================================
async function insertAppointmentMenus() {
  const items: Array<{
    id: string;
    appointment_id: string;
    menu_id: string;
    menu_name_snapshot: string;
    price_snapshot: number;
    duration_minutes_snapshot: number;
    sort_order: number;
  }> = [];
  let idCounter = 1;
  const genId = () =>
    `00000000-0000-0000-0000-00000000a${String(idCounter++).padStart(3, "0")}`;

  const menuData = [
    { id: menuIds[0], name: "フェイシャルベーシック", price: 8000, dur: 60 },
    { id: menuIds[1], name: "フェイシャルプレミアム", price: 12000, dur: 90 },
    { id: menuIds[2], name: "ボディリラクゼーション", price: 7000, dur: 60 },
    { id: menuIds[3], name: "デコルテケア", price: 4000, dur: 30 },
    { id: menuIds[4], name: "ヘッドスパ", price: 5000, dur: 40 },
  ];

  for (let i = 0; i < 15; i++) {
    const m = menuData[i % 5];
    items.push({
      id: genId(),
      appointment_id: appointmentIds[i],
      menu_id: m.id,
      menu_name_snapshot: m.name,
      price_snapshot: m.price,
      duration_minutes_snapshot: m.dur,
      sort_order: 0,
    });
    // 一部に2つ目のメニュー
    if (i < 5) {
      const m2 = menuData[(i + 2) % 5];
      items.push({
        id: genId(),
        appointment_id: appointmentIds[i],
        menu_id: m2.id,
        menu_name_snapshot: m2.name,
        price_snapshot: m2.price,
        duration_minutes_snapshot: m2.dur,
        sort_order: 1,
      });
    }
  }

  const { error } = await supabase.from("appointment_menus").insert(items);
  if (error) throw new Error(`appointment_menus: ${error.message}`);
  console.log(`appointment_menus: ${items.length}件`);
}

// ============================================================
// 物販
// ============================================================
async function insertPurchases() {
  const purchases = [
    // 商品リンク付き（6件）
    { id: purchaseIds[0], customer_id: customerIds[0], purchase_date: daysAgo(3), item_name: "モイスチャーローション", quantity: 1, unit_price: 4500, total_price: 4500, product_id: productIds[0], cost_price: 2000, sell_price: 4500, treatment_record_id: recordIds[0] },
    { id: purchaseIds[1], customer_id: customerIds[1], purchase_date: daysAgo(7), item_name: "リッチクリーム", quantity: 1, unit_price: 6800, total_price: 6800, product_id: productIds[1], cost_price: 3000, sell_price: 6800, treatment_record_id: recordIds[10] },
    { id: purchaseIds[2], customer_id: customerIds[0], purchase_date: daysAgo(14), item_name: "クレンジングオイル", quantity: 2, unit_price: 3200, total_price: 6400, product_id: productIds[2], cost_price: 1400, sell_price: 3200 },
    { id: purchaseIds[3], customer_id: customerIds[2], purchase_date: daysAgo(21), item_name: "UVプロテクトミルク", quantity: 1, unit_price: 2800, total_price: 2800, product_id: productIds[3], cost_price: 1200, sell_price: 2800, treatment_record_id: recordIds[15] },
    { id: purchaseIds[4], customer_id: customerIds[6], purchase_date: daysAgo(28), item_name: "ボディオイル", quantity: 1, unit_price: 5500, total_price: 5500, product_id: productIds[4], cost_price: 2400, sell_price: 5500 },
    { id: purchaseIds[5], customer_id: customerIds[7], purchase_date: daysAgo(35), item_name: "モイスチャーローション", quantity: 1, unit_price: 4500, total_price: 4500, product_id: productIds[0], cost_price: 2000, sell_price: 4500 },
    // 自由入力（4件）
    { id: purchaseIds[6], customer_id: customerIds[0], purchase_date: daysAgo(5), item_name: "サンプルセット", quantity: 1, unit_price: 1500, total_price: 1500, treatment_record_id: recordIds[1] },
    { id: purchaseIds[7], customer_id: customerIds[8], purchase_date: daysAgo(10), item_name: "ヘアアクセサリー", quantity: 2, unit_price: 800, total_price: 1600 },
    { id: purchaseIds[8], customer_id: customerIds[9], purchase_date: daysAgo(15), item_name: "アロマオイル（持ち込み）", quantity: 1, unit_price: 3000, total_price: 3000, memo: "お客様のリクエスト" },
    { id: purchaseIds[9], customer_id: customerIds[10], purchase_date: daysAgo(20), item_name: "ギフトセット", quantity: 1, unit_price: 8000, total_price: 8000, memo: "プレゼント用ラッピング" },
  ];

  const { error } = await supabase
    .from("purchases")
    .insert(purchases.map((p) => ({ ...p, salon_id: TEST_SALON_ID })));
  if (error) throw new Error(`purchases: ${error.message}`);
  console.log(`purchases: ${purchases.length}件`);
}

// ============================================================
// 在庫ログ
// ============================================================
async function insertInventoryLogs() {
  const logs = [
    // 初期入庫（purchase_in）
    { product_id: productIds[0], log_type: "purchase_in", quantity: 10, unit_cost_price: 2000, logged_at: daysAgo(60) },
    { product_id: productIds[1], log_type: "purchase_in", quantity: 8, unit_cost_price: 3000, logged_at: daysAgo(60) },
    { product_id: productIds[2], log_type: "purchase_in", quantity: 10, unit_cost_price: 1400, logged_at: daysAgo(60) },
    { product_id: productIds[3], log_type: "purchase_in", quantity: 6, unit_cost_price: 1200, logged_at: daysAgo(60) },
    { product_id: productIds[4], log_type: "purchase_in", quantity: 5, unit_cost_price: 2400, logged_at: daysAgo(60) },
    // 販売出庫（sale_out）
    { product_id: productIds[0], log_type: "sale_out", quantity: -2, unit_sell_price: 4500, related_purchase_id: purchaseIds[0], logged_at: daysAgo(3) },
    { product_id: productIds[1], log_type: "sale_out", quantity: -1, unit_sell_price: 6800, related_purchase_id: purchaseIds[1], logged_at: daysAgo(7) },
    { product_id: productIds[2], log_type: "sale_out", quantity: -2, unit_sell_price: 3200, related_purchase_id: purchaseIds[2], logged_at: daysAgo(14) },
    { product_id: productIds[3], log_type: "sale_out", quantity: -1, unit_sell_price: 2800, related_purchase_id: purchaseIds[3], logged_at: daysAgo(21) },
    // クレンジングオイル: さらに出庫して在庫を2にする（発注点5以下）
    { product_id: productIds[2], log_type: "sale_out", quantity: -3, logged_at: daysAgo(40) },
    { product_id: productIds[2], log_type: "sale_out", quantity: -3, logged_at: daysAgo(25) },
    // サンプル出庫
    { product_id: productIds[0], log_type: "sample_out", quantity: -1, reason: "お試し用", logged_at: daysAgo(15) },
    { product_id: productIds[4], log_type: "sample_out", quantity: -1, reason: "展示用", logged_at: daysAgo(30) },
    // 棚卸し調整
    { product_id: productIds[1], log_type: "adjust", quantity: -1, reason: "棚卸し差異", logged_at: daysAgo(5) },
    { product_id: productIds[3], log_type: "adjust", quantity: 2, reason: "計上漏れ修正", logged_at: daysAgo(10) },
  ];

  const { error } = await supabase.from("inventory_logs").insert(
    logs.map((l, i) => ({
      id: `00000000-0000-0000-0000-00000000b${String(i + 1).padStart(3, "0")}`,
      salon_id: TEST_SALON_ID,
      ...l,
    }))
  );
  if (error) throw new Error(`inventory_logs: ${error.message}`);
  console.log(`inventory_logs: ${logs.length}件`);
}

// ============================================================
// カウンセリングシート
// ============================================================
async function insertCounselingSheets() {
  const sheets = [
    {
      id: counselingIds[0],
      customer_id: customerIds[2],
      token: "aaaaaaaa-0000-0000-0000-000000000001",
      status: "pending" as const,
      responses: null,
      submitted_at: null,
      expires_at: daysLater(7),
    },
    {
      id: counselingIds[1],
      customer_id: customerIds[0],
      token: "aaaaaaaa-0000-0000-0000-000000000002",
      status: "submitted" as const,
      responses: {
        sec_basic: { f_name: "山田花子", f_age: "35", f_job: "会社員" },
        sec_skin: {
          f_skin_type: "混合肌",
          f_concerns: ["シミ", "毛穴"],
          f_allergy: "特になし",
        },
        sec_goals: {
          f_goals: ["肌質改善", "アンチエイジング"],
          f_notes: "なるべく自然な方法でお願いします",
        },
      },
      submitted_at: daysAgo(30),
      expires_at: daysLater(30),
    },
    {
      id: counselingIds[2],
      customer_id: customerIds[1],
      token: "aaaaaaaa-0000-0000-0000-000000000003",
      status: "submitted" as const,
      responses: {
        sec_basic: { f_name: "佐藤美咲", f_age: "40", f_job: "自営業" },
        sec_skin: {
          f_skin_type: "乾燥肌",
          f_concerns: ["シワ", "たるみ", "くすみ"],
          f_allergy: "アルコール成分に弱い",
        },
        sec_goals: {
          f_goals: ["アンチエイジング", "リラクゼーション"],
          f_notes: "",
        },
      },
      submitted_at: daysAgo(60),
      expires_at: daysAgo(30),
    },
  ];

  const { error } = await supabase
    .from("counseling_sheets")
    .insert(sheets.map((s) => ({ ...s, salon_id: TEST_SALON_ID })));
  if (error) throw new Error(`counseling_sheets: ${error.message}`);
  console.log(`counseling_sheets: ${sheets.length}件`);
}

// ============================================================
// スタッフメニュー
// ============================================================
async function insertStaffMenus() {
  const items = [
    // オーナーは全5メニュー担当
    ...menuIds.slice(0, 5).map((menuId, i) => ({
      id: `00000000-0000-0000-0000-00000000c${String(i + 1).padStart(3, "0")}`,
      staff_id: STAFF_OWNER_ID,
      menu_id: menuId,
      nomination_fee: 0,
    })),
    // スタッフはボディ系3メニュー担当
    { id: "00000000-0000-0000-0000-00000000c006", staff_id: STAFF_MEMBER_ID, menu_id: menuIds[2], nomination_fee: 0 },
    { id: "00000000-0000-0000-0000-00000000c007", staff_id: STAFF_MEMBER_ID, menu_id: menuIds[3], nomination_fee: 0 },
    { id: "00000000-0000-0000-0000-00000000c008", staff_id: STAFF_MEMBER_ID, menu_id: menuIds[4], nomination_fee: 0 },
  ];

  const { error } = await supabase.from("staff_menus").insert(items);
  if (error) throw new Error(`staff_menus: ${error.message}`);
  console.log(`staff_menus: ${items.length}件`);
}

// ============================================================
// スタッフスケジュール上書き
// ============================================================
async function insertStaffScheduleOverrides() {
  const overrides = [
    // オーナー: 今週の1日を休みに
    {
      id: "00000000-0000-0000-0000-00000000d001",
      staff_id: STAFF_OWNER_ID,
      override_date: daysLater(2),
      is_working: false,
      memo: "私用のため休み",
    },
    // スタッフ: 通常休みの日に出勤
    {
      id: "00000000-0000-0000-0000-00000000d002",
      staff_id: STAFF_MEMBER_ID,
      override_date: daysLater(3),
      is_working: true,
      start_time: "10:00",
      end_time: "18:00",
      memo: "振替出勤",
    },
    // オーナー: 来週の短縮営業
    {
      id: "00000000-0000-0000-0000-00000000d003",
      staff_id: STAFF_OWNER_ID,
      override_date: daysLater(7),
      is_working: true,
      start_time: "10:00",
      end_time: "15:00",
      memo: "午後から研修",
    },
  ];

  const { error } = await supabase
    .from("staff_schedule_overrides")
    .insert(overrides.map((o) => ({ ...o, salon_id: TEST_SALON_ID })));
  if (error) throw new Error(`staff_schedule_overrides: ${error.message}`);
  console.log(`staff_schedule_overrides: ${overrides.length}件`);
}

// ============================================================
// 実行
// ============================================================
main().catch((err) => {
  console.error("エラー:", err.message);
  process.exit(1);
});
