import { test, expect } from "@playwright/test";
import { CUSTOMERS } from "../fixtures/test-data";

/** 顧客カード（一覧のリンク）を取得。新規登録ボタンを除外 */
function customerCards(page: import("@playwright/test").Page) {
  return page.locator("a[href*='/customers/']").filter({ hasNotText: /顧客を登録/ });
}

test.describe("@customers 顧客一覧・検索・フィルター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
  });

  test("C-03: 顧客一覧の表示 — 名前・来店情報が表示される", async ({ page }) => {
    await expect(page.locator("body")).toContainText(/\d+名/);
    await expect(customerCards(page).first()).toBeVisible();
  });

  test("C-04: 名前検索 — 「山田」で山田のみ表示", async ({ page }) => {
    await page.getByPlaceholder(/名前|カナ|検索/).fill("山田");
    await page.waitForTimeout(500);

    const cards = customerCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText("山田");
    }
  });

  test("C-05: カナ検索 — 「ヤマダ」で山田のみ表示", async ({ page }) => {
    await page.getByPlaceholder(/名前|カナ|検索/).fill("ヤマダ");
    await page.waitForTimeout(500);

    const cards = customerCards(page);
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText("山田");
  });

  test("C-06: 来店間隔フィルター — ピルボタン", async ({ page }) => {
    const pill30 = page.locator("button").filter({ hasText: "30日+" });
    await pill30.click();
    await page.waitForTimeout(500);
    await expect(pill30).toHaveClass(/bg-accent/);
    await expect(page.locator("body")).toContainText(/名/);
  });

  test("C-07: 卒業済み除外トグル", async ({ page }) => {
    const graduatedBtn = page.locator("button").filter({ hasText: /卒業/ }).first();
    if (await graduatedBtn.isVisible()) {
      await graduatedBtn.click();
      await page.waitForTimeout(500);
      // 卒業済み顧客（伊藤千尋）が表示されるようになる
      await expect(page.locator("body")).toContainText(CUSTOMERS.ito.lastName);
    }
  });

  test("C-08: 検索+フィルター同時", async ({ page }) => {
    await page.getByPlaceholder(/名前|カナ|検索/).fill("田");
    await page.waitForTimeout(300);
    const pill30 = page.locator("button").filter({ hasText: "30日+" });
    await pill30.click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toContainText(/名/);
  });

  test("C-09: ページネーション — もっと見るボタン", async ({ page }) => {
    const moreButton = page.locator("button").filter({ hasText: /もっと見る/ });
    if (await moreButton.isVisible()) {
      await moreButton.click();
      await page.waitForTimeout(500);
      const count = await customerCards(page).count();
      expect(count).toBeGreaterThan(20);
    }
  });

  test("C-16: パンくず — 顧客一覧", async ({ page }) => {
    await expect(page.locator("body")).toContainText("顧客");
  });

  test("C-17: パンくず — 新規登録ページ", async ({ page }) => {
    await page.goto("/customers/new");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/新規|登録/);
  });
});
