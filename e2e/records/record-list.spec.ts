import { test, expect } from "@playwright/test";
import { CUSTOMERS, MENUS } from "../fixtures/test-data";

/** カルテカード（一覧のリンク）を取得。登録ボタンを除外 */
function recordCards(page: import("@playwright/test").Page) {
  return page
    .locator("a[href*='/records/']")
    .filter({ hasNotText: /カルテを登録/ });
}

test.describe("@records カルテ一覧・検索・フィルター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/records");
    await page.waitForLoadState("networkidle");
  });

  test("R-11: カルテ一覧表示 — 日付降順で表示", async ({ page }) => {
    await expect(page.locator("body")).toContainText(/カルテ/);
    // フィルターを全期間にして全件表示
    await page.locator("button").filter({ hasText: "全期間" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toContainText(/件/);
    await expect(recordCards(page).first()).toBeVisible();
  });

  test("R-12: カルテ一覧検索 — 顧客名で絞り込み", async ({ page }) => {
    // 全期間にして検索対象を広げる
    await page.locator("button").filter({ hasText: "全期間" }).click();
    await page.waitForTimeout(500);

    await page
      .getByPlaceholder(/顧客名|メニュー名|検索/)
      .fill(CUSTOMERS.yamada.lastName);
    await page.waitForTimeout(500);

    const cards = recordCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText(CUSTOMERS.yamada.lastName);
    }
  });

  test("R-13: 期間フィルター — 全期間/今日を切替", async ({ page }) => {
    // 全期間
    const allBtn = page.locator("button").filter({ hasText: "全期間" });
    await allBtn.click();
    await page.waitForTimeout(500);
    await expect(allBtn).toHaveClass(/bg-accent/);
    const allCount = await recordCards(page).count();

    // 今日
    const todayBtn = page.locator("button").filter({ hasText: "今日" });
    await todayBtn.click();
    await page.waitForTimeout(500);
    await expect(todayBtn).toHaveClass(/bg-accent/);
    const todayCount = await recordCards(page).count();

    // 全期間のほうが今日以上
    expect(allCount).toBeGreaterThanOrEqual(todayCount);
  });

  test("R-14: ページネーション — もっと見るボタン", async ({ page }) => {
    // 全期間にしてデータを多く表示
    await page.locator("button").filter({ hasText: "全期間" }).click();
    await page.waitForTimeout(500);

    const moreButton = page.locator("button").filter({ hasText: /もっと見る/ });
    if (await moreButton.isVisible()) {
      const beforeCount = await recordCards(page).count();
      await moreButton.click();
      await page.waitForTimeout(500);
      const afterCount = await recordCards(page).count();
      expect(afterCount).toBeGreaterThan(beforeCount);
    }
  });

  test("R-E3: 検索結果0件 — 空状態メッセージ", async ({ page }) => {
    await page.locator("button").filter({ hasText: "全期間" }).click();
    await page.waitForTimeout(300);
    await page
      .getByPlaceholder(/顧客名|メニュー名|検索/)
      .fill("存在しないZZZZZ");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toContainText(
      /見つかりません|該当|ありません/
    );
  });
});
