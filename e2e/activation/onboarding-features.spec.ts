/**
 * @activation オンボーディング新機能の E2E
 *
 * 対象機能（2026-05-28 実装）:
 * - サンプルデータ オプトイン投入 + ダッシュボードのバナー
 * - 業種選択 → Step3 メニュープリセット
 * - /records/new 前提不足ガード
 * - 1件目・2件目カルテ Reward toast
 *
 * 戦略:
 * - 各テストは createConfirmedUser でフレッシュユーザーを作り
 * - setup を最低限経由（Step1の業種選択は必須）してから検証対象に進む
 * - cleanupActivationUser でユーザー + 関連サロン（+ サンプル）を消す
 */
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  ACTIVATION_PASSWORD,
  cleanupActivationUser,
  createConfirmedUser,
  generateActivationEmail,
} from "../fixtures/test-users";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getSalonId(userId: string): Promise<string | null> {
  const { data } = await getAdmin()
    .from("salons")
    .select("id")
    .eq("owner_id", userId)
    .single();
  return data?.id ?? null;
}

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]:has-text("ログイン")');
  await page.waitForURL(/\/setup/, { timeout: 15_000 });
}

/** Step1〜Step4 をスキップ込みで最小実行（サンプル投入オプションだけ指定） */
async function runSetup(
  page: import("@playwright/test").Page,
  opts: { salonName: string; withSample: boolean; menuName?: string },
) {
  // Step 1: サロン名 + 業種選択
  await page.fill("#setup-name", opts.salonName);
  await page.locator("button").filter({ hasText: /^エステ$/ }).click();
  await page.locator("button[type='submit']").filter({ hasText: /次へ/ }).click();

  // Step 2: 営業時間スキップ
  await page.locator("button").filter({ hasText: /スキップ/ }).click();

  // Step 3: メニュー（指定があれば入力、なければスキップ）
  if (opts.menuName) {
    await page.fill("#setup-menu-name", opts.menuName);
    await page.fill("#setup-menu-duration", "60");
    await page.fill("#setup-menu-price", "5000");
    await page.locator("button[type='submit']").filter({ hasText: /完了/ }).click();
  } else {
    await page.locator("button").filter({ hasText: /スキップ/ }).click();
  }

  // Step 4: サンプル or 自分のデータ
  const btnText = opts.withSample ? /サンプルで使い方を試す/ : /^サンプルなしで始める$/;
  await page.locator("button").filter({ hasText: btnText }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("@activation サンプルデータ投入と削除", () => {
  test("ON-SAMPLE-01: サンプル投入を選ぶ → ダッシュボードにバナーと顧客が表示される", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2Eサンプル_${Date.now()}`;

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);
      await runSetup(page, { salonName, withSample: true });

      // ダッシュボードでサンプルバナーが表示される
      await expect(page.locator("body")).toContainText("お試し用のサンプルが入っています", { timeout: 10_000 });
      await expect(page.locator("button").filter({ hasText: "サンプルを全部消す" })).toBeVisible();

      // 顧客一覧にサンプル顧客が見える（表示は「姓 名」と半角スペース区切り）
      await page.goto("/customers");
      await expect(page.locator("body")).toContainText(/サンプル\s*花子/);
      await expect(page.locator("body")).toContainText(/サンプル\s*美咲/);

      // DB で投入されたサンプルデータを総合確認
      const salonId = await getSalonId(userId);
      expect(salonId).not.toBeNull();
      const admin = getAdmin();
      const [{ count: customerCount }, { count: menuCount }, { count: appointmentCount }, { count: recordCount }] = await Promise.all([
        admin.from("customers").select("id", { count: "exact", head: true }).eq("salon_id", salonId!).eq("is_sample", true),
        admin.from("treatment_menus").select("id", { count: "exact", head: true }).eq("salon_id", salonId!).eq("is_sample", true),
        admin.from("appointments").select("id", { count: "exact", head: true }).eq("salon_id", salonId!),
        admin.from("treatment_records").select("id", { count: "exact", head: true }).eq("salon_id", salonId!),
      ]);
      expect(customerCount).toBe(2);
      expect(menuCount).toBe(1);
      expect(appointmentCount).toBe(1); // 予約も作られていること（appointments_source_check 制約違反の検知）
      expect(recordCount).toBe(1);
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });

  test("ON-SAMPLE-02: バナーから一括削除 → サンプル顧客が消える", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2Eサンプル削除_${Date.now()}`;

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);
      await runSetup(page, { salonName, withSample: true });

      // バナーが見える状態でスタート
      await expect(page.locator("body")).toContainText("お試し用のサンプルが入っています");

      // 1. 「サンプルを全部消す」ボタン押下 → インライン確認パネル表示
      await page.locator("button").filter({ hasText: /^サンプルを全部消す$/ }).click();
      await expect(page.locator("body")).toContainText("本当にサンプルを全部消しますか");

      // 2. 「全部消す」で実行
      await page.locator("button").filter({ hasText: /^全部消す$/ }).click();

      // バナーが消える（router.refresh で再取得後）
      await expect(page.locator("body")).not.toContainText("お試し用のサンプルが入っています", { timeout: 10_000 });

      // DB で is_sample 顧客が 0 件
      const salonId = await getSalonId(userId);
      const { count } = await getAdmin()
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("salon_id", salonId!)
        .eq("is_sample", true);
      expect(count).toBe(0);
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });
});

test.describe("@activation Step3 メニュープリセット", () => {
  test("ON-PRESET-01: プリセットボタンをタップするとメニュー名と料金が自動入力される", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2Eプリセット_${Date.now()}`;

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);

      // Step 1: 業種をネイル選択
      await page.fill("#setup-name", salonName);
      await page.locator("button").filter({ hasText: /^ネイル$/ }).click();
      await page.locator("button[type='submit']").filter({ hasText: /次へ/ }).click();

      // Step 2: 営業時間スキップ
      await page.locator("button").filter({ hasText: /スキップ/ }).click();

      // Step 3: プリセットが表示されているか確認
      await expect(page.locator("body")).toContainText("候補から選ぶ");
      await expect(page.locator("body")).toContainText("ハンドジェル");

      // プリセットをタップ
      await page.locator("button").filter({ hasText: /ハンドジェル.*90分.*7,000円/ }).click();

      // フォームに値が入る
      await expect(page.locator("#setup-menu-name")).toHaveValue("ハンドジェル");
      await expect(page.locator("#setup-menu-duration")).toHaveValue("90");
      await expect(page.locator("#setup-menu-price")).toHaveValue("7000");
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });
});

test.describe("@activation /records/new 前提不足ガード", () => {
  test("ON-GUARD-01: 顧客0件 + メニュー0件のサロンで /records/new → 登録CTAバナーが2つ表示", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2Eガード_${Date.now()}`;

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);
      // メニュー登録なしでセットアップを完走（サンプルも入れない）
      await runSetup(page, { salonName, withSample: false });

      // /records/new を直接開く
      await page.goto("/records/new");
      await page.waitForLoadState("networkidle");

      // ガードのタイトルとCTAリンクが見える
      await expect(page.locator("body")).toContainText("カルテを記録する前に", { timeout: 10_000 });
      await expect(page.locator("body")).toContainText("お客様");
      await expect(page.locator("body")).toContainText("メニュー");
      await expect(page.locator("a").filter({ hasText: /顧客を登録する/ })).toBeVisible();
      await expect(page.locator("a").filter({ hasText: /メニューを登録する/ })).toBeVisible();
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });

  test("ON-GUARD-02: 顧客あり・メニューなしの場合はメニュー登録のみ要求", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2Eガード片方_${Date.now()}`;

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);
      await runSetup(page, { salonName, withSample: false });

      // adminで顧客だけ追加（メニューは0件のまま）
      const salonId = await getSalonId(userId);
      await getAdmin().from("customers").insert({
        salon_id: salonId!,
        last_name: "テスト",
        first_name: "顧客A",
      });

      await page.goto("/records/new");
      await page.waitForLoadState("networkidle");

      // メニュー登録CTAだけ表示
      await expect(page.locator("body")).toContainText("カルテを記録する前に");
      await expect(page.locator("a").filter({ hasText: /メニューを登録する/ })).toBeVisible();
      // 顧客登録CTAは表示されない
      await expect(page.locator("a").filter({ hasText: /顧客を登録する/ })).toHaveCount(0);
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });
});

test.describe("@activation 1件目・2件目 Reward toast", () => {
  test("ON-REWARD-01: 初カルテ保存 → 🎉 トースト表示", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2EReward1_${Date.now()}`;

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);
      await runSetup(page, { salonName, withSample: false, menuName: "テストメニュー" });

      // admin で顧客を作成
      const salonId = await getSalonId(userId);
      const { data: customer } = await getAdmin()
        .from("customers")
        .insert({ salon_id: salonId!, last_name: "報酬", first_name: "テスト" })
        .select("id")
        .single();
      expect(customer).not.toBeNull();

      // /records/new で1件保存
      await page.goto(`/records/new?customer=${customer!.id}`);
      await page.waitForLoadState("networkidle");

      // メニュー選択
      const checkbox = page.locator("input[type='checkbox']").first();
      await expect(checkbox).toBeVisible({ timeout: 10_000 });
      await checkbox.check();

      // 保存
      const saveBtn = page.locator("button[type='submit']").filter({ hasText: /保存/ });
      await saveBtn.scrollIntoViewIfNeeded();
      await saveBtn.click();

      // 顧客詳細に遷移 → 1件目Rewardトーストが見える
      await page.waitForURL(/\/customers\/[^/]+$/, { timeout: 15_000 });
      await expect(page.locator("body")).toContainText("最初のカルテを記録しました", { timeout: 10_000 });
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });

  test("ON-REWARD-02: 2件目カルテ保存 → 🎊 トースト表示", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2EReward2_${Date.now()}`;

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);
      await runSetup(page, { salonName, withSample: false, menuName: "テストメニュー" });

      const salonId = await getSalonId(userId);
      const admin = getAdmin();

      // 顧客 + メニュー名snapshot付き既存カルテ1件をadminで作成（事前状態）
      const { data: customer } = await admin
        .from("customers")
        .insert({ salon_id: salonId!, last_name: "報酬2", first_name: "テスト" })
        .select("id")
        .single();
      await admin.from("treatment_records").insert({
        salon_id: salonId!,
        customer_id: customer!.id,
        treatment_date: new Date().toISOString().slice(0, 10),
        record_type: "visit",
      });

      // /records/new で2件目を保存
      await page.goto(`/records/new?customer=${customer!.id}`);
      await page.waitForLoadState("networkidle");
      const checkbox = page.locator("input[type='checkbox']").first();
      await expect(checkbox).toBeVisible({ timeout: 10_000 });
      await checkbox.check();
      const saveBtn = page.locator("button[type='submit']").filter({ hasText: /保存/ });
      await saveBtn.scrollIntoViewIfNeeded();
      await saveBtn.click();

      // 2件目トースト
      await page.waitForURL(/\/customers\/[^/]+$/, { timeout: 15_000 });
      await expect(page.locator("body")).toContainText("2件目を記録しました", { timeout: 10_000 });
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });
});
