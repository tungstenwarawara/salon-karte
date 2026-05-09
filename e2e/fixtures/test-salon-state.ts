/**
 * テストサロンの一時的な状態変更ヘルパー
 *
 * 用途:
 * - billing/portal のテストで plan_type を一時的に standard に切替
 * - subscription テーブルにダミーレコードを挿入
 * - テスト終了時に必ず元の状態に戻すこと（finally で呼ぶ）
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
      "test-salon-state には NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です",
    );
  }
  cachedAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdmin;
}

/**
 * テストサロンの plan_type を変更する。
 * 戻り値の restore を finally 句で呼んで元に戻すこと。
 */
export async function setTestSalonPlanType(planType: "free" | "standard"): Promise<() => Promise<void>> {
  const admin = getAdmin();

  // 現在の値を保存
  const { data: current } = await admin
    .from("salons")
    .select("plan_type")
    .eq("id", TEST_SALON_ID)
    .single();
  const original = (current?.plan_type as "free" | "standard") ?? "free";

  // 変更
  await admin.from("salons").update({ plan_type: planType }).eq("id", TEST_SALON_ID);

  return async () => {
    await admin.from("salons").update({ plan_type: original }).eq("id", TEST_SALON_ID);
  };
}

/**
 * テストサロンに偽の subscriptions レコードを作成する。
 * portal/billing UI のテスト用 — Stripe 側には実体なし。
 *
 * 戻り値の restore を finally 句で呼ぶこと。
 */
export async function setTestSalonFakeSubscription(opts?: {
  status?: "active" | "past_due" | "canceled";
  current_period_end?: string;
}): Promise<() => Promise<void>> {
  const admin = getAdmin();
  const customerId = `cus_test_e2e_${Date.now()}`;
  const subId = `sub_test_e2e_${Date.now()}`;

  // 既存があれば削除（クリーンな状態から開始）
  await admin.from("subscriptions").delete().eq("salon_id", TEST_SALON_ID);

  await admin.from("subscriptions").insert({
    salon_id: TEST_SALON_ID,
    stripe_customer_id: customerId,
    stripe_subscription_id: subId,
    status: opts?.status ?? "active",
    current_period_end:
      opts?.current_period_end ?? new Date(Date.now() + 30 * 86400_000).toISOString(),
  });

  return async () => {
    await admin.from("subscriptions").delete().eq("salon_id", TEST_SALON_ID);
  };
}
