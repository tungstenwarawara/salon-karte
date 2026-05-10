/**
 * @plan-gate-limit プラン制限「到達」時の振る舞い E2E
 *
 * plan-gate.spec.ts は「制限未到達時の正常表示」を検証する一方、
 * このファイルは「制限値ギリギリ／到達後の挙動」を検証する。
 *
 * 流れ:
 * - beforeAll で前回の残骸を念のため掃除
 * - 各テストで ensureXxxCount(target) を呼んで閾値を作る
 * - 検証
 * - finally で cleanup（挿入分のみ削除、既存データには触れない）
 *
 * 高速化のため、警告(80%)とモーダル(100%)を別 describe にして
 * 各 describe 内では1回だけ seed する。
 */
import { test, expect, type Page } from "@playwright/test";
import { setTestSalonPlanType } from "../fixtures/test-salon-state";
import {
  ensureCustomerCount,
  ensureRecordCount,
  ensureAppointmentsThisMonth,
  cleanupAllGateTestData,
} from "../fixtures/seed-helpers";

async function gotoAndWait(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

async function clearLocalStorage(page: Page) {
  // 80%警告は localStorage で「24時間以内に閉じた」を記憶するため、必ずクリア
  try {
    await page.evaluate(() => localStorage.clear());
  } catch {
    // about:blank などで失敗するケースは無視
  }
}

test.beforeAll(async () => {
  // 前回の異常終了でデータが残っていた場合に備えて掃除
  await cleanupAllGateTestData();
});

test.afterAll(async () => {
  // 念のため最終クリーンアップ
  await cleanupAllGateTestData();
});

// =============================================================================
// 80% 警告（顧客）
// =============================================================================
test.describe("@plan-gate-limit 顧客 80% 警告", () => {
  test("PGL-01: 顧客40件（80%到達）→ 警告バナー表示", async ({ page }) => {
    const restorePlan = await setTestSalonPlanType("free");
    const cleanupCustomers = await ensureCustomerCount(40);
    try {
      await page.goto("/customers");
      await clearLocalStorage(page);
      await page.reload();
      await page.waitForLoadState("networkidle");

      // 80%警告バナー: 「もうすぐ顧客の上限です」
      await expect(page.locator("body")).toContainText("もうすぐ");
      await expect(page.locator("body")).toContainText(/顧客の上限/);
      await expect(page.locator("body")).toContainText(/あと\s*\d+\s*人/);
      // 「スタンダードプランを見る」リンク
      await expect(page.locator("body")).toContainText("スタンダードプランを見る");
    } finally {
      await cleanupCustomers();
      await restorePlan();
    }
  });
});

// =============================================================================
// 100% 到達（顧客）
// =============================================================================
test.describe("@plan-gate-limit 顧客 100% モーダル", () => {
  test("PGL-02: 顧客50件（上限到達）→ ボタン化 + モーダル表示", async ({ page }) => {
    const restorePlan = await setTestSalonPlanType("free");
    const cleanupCustomers = await ensureCustomerCount(50);
    try {
      await gotoAndWait(page, "/customers");

      // 「+ 顧客を登録」ボタンを発見し、Link ではなく button であることを確認
      // （画面上は同じ見た目だが、上限到達時は button、未到達時は Link）
      const createBtn = page.locator(":is(a, button)").filter({
        hasText: /\+ 顧客を登録/,
      }).first();
      await expect(createBtn).toBeVisible();

      // クリックすると遷移ではなくモーダルが開く
      await createBtn.click();

      // モーダルのタイトル
      await expect(page.locator("body")).toContainText(
        "顧客の登録上限に達しました",
      );
      // 比較カード
      await expect(page.locator("body")).toContainText("おためしプラン");
      await expect(page.locator("body")).toContainText("スタンダードプラン");
      // 主要CTA
      await expect(
        page.locator(":is(a, button)").filter({ hasText: /スタンダードに切り替える/ }),
      ).toBeVisible();

      // URL は /customers のまま（遷移していない）
      expect(page.url()).toContain("/customers");
      expect(page.url()).not.toContain("/customers/new");

      // 戻るボタンで閉じる
      await page.locator("button").filter({ hasText: /^戻る$/ }).click();
      // モーダルが消えたことを確認（タイトルが見えなくなる）
      await expect(page.locator("body")).not.toContainText(
        "顧客の登録上限に達しました",
      );
    } finally {
      await cleanupCustomers();
      await restorePlan();
    }
  });
});

// =============================================================================
// 100% 到達（カルテ）
// =============================================================================
test.describe("@plan-gate-limit カルテ 100% モーダル", () => {
  test("PGL-03: カルテ100件（上限到達）→ +カルテを登録でモーダル", async ({ page }) => {
    const restorePlan = await setTestSalonPlanType("free");
    const cleanupRecords = await ensureRecordCount(100);
    try {
      await gotoAndWait(page, "/records");

      const createBtn = page.locator(":is(a, button)").filter({
        hasText: /\+ カルテを登録/,
      }).first();
      await expect(createBtn).toBeVisible();
      await createBtn.click();

      await expect(page.locator("body")).toContainText(
        "カルテの登録上限に達しました",
      );
      // URL は /records のまま
      expect(page.url()).not.toContain("/records/new");
    } finally {
      await cleanupRecords();
      await restorePlan();
    }
  });
});

// =============================================================================
// 100% 到達（予約・今月）
// =============================================================================
test.describe("@plan-gate-limit 予約 100% モーダル", () => {
  test("PGL-04: 当月予約30件（上限到達）→ +予約を登録でモーダル", async ({ page }) => {
    const restorePlan = await setTestSalonPlanType("free");
    const cleanupAppts = await ensureAppointmentsThisMonth(30);
    try {
      await gotoAndWait(page, "/appointments");

      const createBtn = page.locator(":is(a, button)").filter({
        hasText: /\+ 予約を登録/,
      }).first();
      await expect(createBtn).toBeVisible();
      await createBtn.click();

      // 予約のラベルは「予約（今月）の登録上限に達しました」
      await expect(page.locator("body")).toContainText(
        "予約（今月）の登録上限に達しました",
      );
      // URL が /appointments のまま（new に遷移していない）
      expect(page.url()).not.toContain("/appointments/new");
    } finally {
      await cleanupAppts();
      await restorePlan();
    }
  });
});

// =============================================================================
// ダッシュボード — 上限到達時の警告色
// =============================================================================
test.describe("@plan-gate-limit ダッシュボード警告色", () => {
  test("PGL-05: 顧客50件 → ダッシュボード上のプラン状態カードに警告メッセージ", async ({
    page,
  }) => {
    const restorePlan = await setTestSalonPlanType("free");
    const cleanupCustomers = await ensureCustomerCount(50);
    try {
      await gotoAndWait(page, "/dashboard");

      // 「上限到達 — アップグレードして無制限に」
      await expect(page.locator("body")).toContainText(/上限到達/);
      // 50/50 の表示
      await expect(page.locator("body")).toContainText(/50\s*\/\s*50/);
    } finally {
      await cleanupCustomers();
      await restorePlan();
    }
  });
});

// =============================================================================
// /settings/billing の使用状況バー — 100% 表示
// =============================================================================
test.describe("@plan-gate-limit 料金プラン — 使用状況の100%表示", () => {
  test("PGL-06: 顧客50件 → 料金プランページの使用状況バー 50/50", async ({ page }) => {
    const restorePlan = await setTestSalonPlanType("free");
    const cleanupCustomers = await ensureCustomerCount(50);
    try {
      await gotoAndWait(page, "/settings/billing");

      // 使用状況バーで顧客 50人 / 50 が表示（UsageBar は単位を current 側にだけ付ける）
      await expect(page.locator("body")).toContainText(/50\s*人\s*\/\s*50/);
    } finally {
      await cleanupCustomers();
      await restorePlan();
    }
  });
});

// =============================================================================
// Standard プランは制限を超えてもブロックされない
// =============================================================================
test.describe("@plan-gate-limit Standard はブロックされない", () => {
  test("PGL-07: standard で顧客100件あっても通常Linkで /customers/new に遷移", async ({
    page,
  }) => {
    const restorePlan = await setTestSalonPlanType("standard");
    // Free 制限の倍を投入してもブロックされないことを確認
    const cleanupCustomers = await ensureCustomerCount(100);
    try {
      await gotoAndWait(page, "/customers");

      const createBtn = page.locator(":is(a, button)").filter({
        hasText: /\+ 顧客を登録/,
      }).first();
      await createBtn.click();

      // 通常通り /customers/new へ遷移する
      await page.waitForURL(/\/customers\/new/, { timeout: 10_000 });

      // モーダルは出ない
      await expect(page.locator("body")).not.toContainText(
        "顧客の登録上限に達しました",
      );
    } finally {
      await cleanupCustomers();
      await restorePlan();
    }
  });
});
