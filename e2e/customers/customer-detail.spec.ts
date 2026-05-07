import { test, expect } from "@playwright/test";
import { CUSTOMERS } from "../fixtures/test-data";
import { uniqueName } from "../fixtures/test-helpers";

/** 山田花子の詳細ページに遷移（検索で絞り込んでからクリック） */
async function gotoYamadaDetail(page: import("@playwright/test").Page) {
  await page.goto("/customers");
  await page.waitForLoadState("networkidle");
  // 検索で絞り込み（ページネーションで見えない場合に対応）
  await page.getByPlaceholder(/名前|カナ|検索/).fill(CUSTOMERS.yamada.lastName);
  await page.waitForTimeout(500);
  const cards = page.locator("a[href*='/customers/']").filter({ hasNotText: /顧客を登録/ });
  await cards.filter({ hasText: CUSTOMERS.yamada.lastName }).first().click();
  await page.waitForURL(/\/customers\/[^/]+$/);
}

test.describe("@customers 顧客詳細", () => {
  test("C-10: 顧客詳細表示 — 基本情報", async ({ page }) => {
    await gotoYamadaDetail(page);
    await expect(page.locator("body")).toContainText(CUSTOMERS.yamada.lastName);
    await expect(page.locator("body")).toContainText(CUSTOMERS.yamada.firstName);
  });

  test("C-11: 顧客詳細の関連データ — 施術履歴・回数券セクション", async ({ page }) => {
    await gotoYamadaDetail(page);
    await expect(page.locator("body")).toContainText(/施術履歴|カルテ/);
    await expect(page.locator("body")).toContainText(/回数券/);
  });

  test("C-18: パンくず — 編集ページに顧客名が表示される", async ({ page }) => {
    await gotoYamadaDetail(page);
    await page.locator("a").filter({ hasText: /編集/ }).first().click();
    await page.waitForURL(/\/edit$/);
    await expect(page.locator("body")).toContainText(CUSTOMERS.yamada.lastName);
  });

  // --- エラー系 ---

  test("C-E1: 姓を空で登録 → 送信されない", async ({ page }) => {
    await page.goto("/customers/new");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("花子").fill("太郎");
    await page.locator("button[type='submit']").filter({ hasText: /保存/ }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/customers\/new/);
  });

  test("C-E3: 保存中の二重送信防止", async ({ page }) => {
    const lastName = uniqueName("二重送信");
    await page.goto("/customers/new");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("山田").fill(lastName);
    await page.getByPlaceholder("花子").fill("テスト");

    const submitBtn = page.locator("button[type='submit']").filter({ hasText: /保存/ });
    await submitBtn.click();

    const isDisabledOrLoading = await Promise.race([
      submitBtn.isDisabled().then(d => d),
      submitBtn.textContent().then(t => t?.includes("保存中")),
    ]);
    expect(isDisabledOrLoading).toBeTruthy();

    // クリーンアップ
    await page.waitForURL(/\/customers\/[^/]+$/, { timeout: 10_000 });
    await page.locator("a").filter({ hasText: /編集/ }).first().click();
    await page.waitForURL(/\/edit$/);
    const firstInput = page.locator("input[type='text'], input:not([type])").first();
    await expect(firstInput).not.toHaveValue("", { timeout: 10_000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: /この顧客を削除/ }).click();
    await page.locator("button").filter({ hasText: /^削除する$/ }).click();
    await page.waitForURL(/\/customers$/, { timeout: 10_000 });
  });

  test("C-E4: 検索で該当なし → 空状態メッセージ", async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder(/名前|カナ|検索/).fill("存在しないZZZZZ");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toContainText(/見つかりません|該当/);
  });
});
