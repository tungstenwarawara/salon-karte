/**
 * プラン制限到達 E2E テスト用の seed ヘルパー
 *
 * 目的: テストサロンの顧客・カルテ・予約数を一時的に「ある閾値以上」にして、
 *       80% 警告 / 100% モーダル の表示を検証する。
 *
 * 設計:
 * - `ensureXxxCount(target)` は「現在のカウント < target」のときに不足分を投入する。
 *   現在がすでに target 以上なら何もしない（重複起動への耐性）。
 * - 投入したレコードの id を保持し、戻り値の cleanup() で確実に削除する。
 * - finally 句から呼ぶ前提（テスト失敗時もリーク防止）。
 * - notes / notes_after / memo に "E2E_GATE_TEST" マーカーを入れて視認性を確保。
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { TEST_SALON_ID } from "./auth";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

let cachedAdmin: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "seed-helpers には NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です",
    );
  }
  cachedAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdmin;
}

const MARKER = "E2E_GATE_TEST";

/**
 * テストサロンの顧客総数を `target` 以上に引き上げる。
 * 戻り値 cleanup() で挿入分のみ削除（既存データには触れない）。
 */
export async function ensureCustomerCount(target: number): Promise<() => Promise<void>> {
  const admin = getAdmin();
  const { count } = await admin
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", TEST_SALON_ID);
  const baseline = count ?? 0;
  if (baseline >= target) return async () => {};

  const needed = target - baseline;
  const stamp = Date.now();
  const rows = Array.from({ length: needed }, (_, i) => ({
    salon_id: TEST_SALON_ID,
    last_name: "ゲートテスト",
    first_name: `${stamp}-${i}`,
    notes: MARKER,
  }));

  const { data, error } = await admin
    .from("customers")
    .insert(rows)
    .select("id");
  if (error) throw new Error(`顧客 seed 失敗: ${error.message}`);
  const ids = (data ?? []).map((r) => r.id as string);

  return async () => {
    if (ids.length === 0) return;
    await admin.from("customers").delete().in("id", ids);
  };
}

/**
 * テストサロンのカルテ総数を `target` 以上に引き上げる。
 * 戻り値 cleanup() で挿入分のみ削除。
 */
export async function ensureRecordCount(target: number): Promise<() => Promise<void>> {
  const admin = getAdmin();

  // カルテ作成には customer_id が必須なので、テストサロンの既存顧客を1件取得
  const { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("salon_id", TEST_SALON_ID)
    .limit(1)
    .maybeSingle();
  if (!customer) {
    throw new Error("テストサロンに顧客が1件もない（先に seed-test-data を流すこと）");
  }

  const { count } = await admin
    .from("treatment_records")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", TEST_SALON_ID);
  const baseline = count ?? 0;
  if (baseline >= target) return async () => {};

  const needed = target - baseline;
  const today = new Date().toISOString().slice(0, 10);
  const rows = Array.from({ length: needed }, () => ({
    salon_id: TEST_SALON_ID,
    customer_id: customer.id,
    treatment_date: today,
    notes_after: MARKER,
  }));

  const { data, error } = await admin
    .from("treatment_records")
    .insert(rows)
    .select("id");
  if (error) throw new Error(`カルテ seed 失敗: ${error.message}`);
  const ids = (data ?? []).map((r) => r.id as string);

  return async () => {
    if (ids.length === 0) return;
    await admin.from("treatment_records").delete().in("id", ids);
  };
}

/**
 * 当月の予約数を `target` 以上に引き上げる。
 * 戻り値 cleanup() で挿入分のみ削除。
 */
export async function ensureAppointmentsThisMonth(target: number): Promise<() => Promise<void>> {
  const admin = getAdmin();

  const { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("salon_id", TEST_SALON_ID)
    .limit(1)
    .maybeSingle();
  if (!customer) {
    throw new Error("テストサロンに顧客が1件もない");
  }

  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfNextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

  const { count } = await admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", TEST_SALON_ID)
    .gte("appointment_date", startOfMonth)
    .lt("appointment_date", startOfNextMonth);
  const baseline = count ?? 0;
  if (baseline >= target) return async () => {};

  const needed = target - baseline;
  // 全部同じ日に詰めると視認性が悪いので、月内で分散
  const rows = Array.from({ length: needed }, (_, i) => {
    const day = ((i % 27) + 1).toString().padStart(2, "0");
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${day}`;
    const hour = (8 + (i % 10)).toString().padStart(2, "0");
    const minute = ((i * 7) % 60).toString().padStart(2, "0");
    return {
      salon_id: TEST_SALON_ID,
      customer_id: customer.id,
      appointment_date: date,
      start_time: `${hour}:${minute}:00`,
      status: "scheduled",
      memo: MARKER,
    };
  });

  const { data, error } = await admin
    .from("appointments")
    .insert(rows)
    .select("id");
  if (error) throw new Error(`予約 seed 失敗: ${error.message}`);
  const ids = (data ?? []).map((r) => r.id as string);

  return async () => {
    if (ids.length === 0) return;
    await admin.from("appointments").delete().in("id", ids);
  };
}

/**
 * 緊急用: マーカー付きの全テストデータを掃除する（前回の失敗で残骸があった場合）。
 * テストの beforeAll で念のため呼ぶか、手動で叩く。
 */
export async function cleanupAllGateTestData(): Promise<void> {
  const admin = getAdmin();
  await Promise.all([
    admin.from("customers").delete().eq("salon_id", TEST_SALON_ID).eq("notes", MARKER),
    admin.from("treatment_records").delete().eq("salon_id", TEST_SALON_ID).eq("notes_after", MARKER),
    admin.from("appointments").delete().eq("salon_id", TEST_SALON_ID).eq("memo", MARKER),
  ]);
}
