import { test, expect } from "@playwright/test";
import { CUSTOMERS } from "../fixtures/test-data";

/**
 * カルテ記録種別: キャンセル / メモ
 * - カルテ単独でキャンセル記録を作成
 * - メモを作成
 * - 種別タブが正しく切り替わる
 */

test.describe("@records キャンセル / メモ種別", () => {
  test("RT-10: カルテ作成画面で「キャンセル」を選ぶとメニュー欄が消え、キャンセル理由欄が出る", async ({
    page,
  }) => {
    await page.goto("/records/new");
    await page.waitForLoadState("networkidle");

    const skipBtn = page.locator("button[type='button']").filter({ hasText: "予約に紐づけずにカルテを登録" });
    if (await skipBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }

    // 顧客選択
    const customerSearch = page.getByPlaceholder("名前・カナで検索...");
    await expect(customerSearch).toBeVisible({ timeout: 10_000 });
    await customerSearch.fill(CUSTOMERS.tanaka.lastName);
    await page.waitForTimeout(500);
    const candidate = page.locator("button[type='button']").filter({ hasText: CUSTOMERS.tanaka.lastName }).first();
    await candidate.click();
    await page.waitForTimeout(300);

    // キャンセルタブを選択
    await page.locator("button").filter({ hasText: "キャンセル" }).first().click();
    await page.waitForTimeout(300);

    // メニュー欄が消える
    await expect(page.locator("text=施術メニュー")).not.toBeVisible();
    // キャンセル理由欄が出る
    await expect(page.locator("text=キャンセル理由")).toBeVisible();
    // 「来店分析にはカウントされません」の注意書きが表示される
    await expect(page.locator("text=来店分析にはカウントされません")).toBeVisible();
  });

  test("RT-11: 「メモ」種別を選ぶとメモ欄が表示される", async ({ page }) => {
    await page.goto("/records/new");
    await page.waitForLoadState("networkidle");

    const skipBtn = page.locator("button[type='button']").filter({ hasText: "予約に紐づけずにカルテを登録" });
    if (await skipBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }

    const customerSearch = page.getByPlaceholder("名前・カナで検索...");
    await expect(customerSearch).toBeVisible({ timeout: 10_000 });
    await customerSearch.fill(CUSTOMERS.suzuki.lastName);
    await page.waitForTimeout(500);
    const candidate = page.locator("button[type='button']").filter({ hasText: CUSTOMERS.suzuki.lastName }).first();
    await candidate.click();
    await page.waitForTimeout(300);

    // メモタブを選択
    await page.locator("button").filter({ hasText: "メモ" }).first().click();
    await page.waitForTimeout(300);

    await expect(page.locator("text=施術メニュー")).not.toBeVisible();
    // 「メモの日付」ラベルと区別するため hasNotText で絞る
    await expect(page.locator("label").filter({ hasText: "メモ" }).filter({ hasNotText: "日付" })).toBeVisible();
  });
});
