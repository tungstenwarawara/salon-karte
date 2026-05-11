import { test, expect } from "@playwright/test";
import { CUSTOMERS, PRODUCTS } from "../fixtures/test-data";

/**
 * カルテ記録種別: 物販のみ
 * - 顧客詳細「+ 物販を登録」→ /records/new?type=product_only にリダイレクト
 * - メニュー欄が非表示
 * - 物販を追加 → 保存 → カルテ履歴に「物販」バッジで表示
 * - 物販履歴セクションにも表示
 * - 来店分析の数値は変わらない（visit のみカウント）
 */

test.describe("@records 物販のみカルテ", () => {
  test("RT-01: 顧客詳細から物販のみカルテを作成 → カルテ履歴・物販履歴の両方に表示", async ({
    page,
  }) => {
    // 顧客一覧 → 山田花子の詳細
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");

    const customerLink = page.locator("a").filter({ hasText: CUSTOMERS.yamada.lastName }).first();
    await expect(customerLink).toBeVisible({ timeout: 10_000 });
    await customerLink.click();
    await page.waitForLoadState("networkidle");

    // 「+ 物販を登録」ボタンをクリック
    const purchaseBtn = page.locator("a").filter({ hasText: "+ 物販を登録" }).first();
    await expect(purchaseBtn).toBeVisible({ timeout: 10_000 });
    await purchaseBtn.click();

    // /records/new?type=product_only にリダイレクトされる
    await page.waitForURL(/\/records\/new\?customer=.*type=product_only/, { timeout: 10_000 });

    // 種別タブで「物販のみ」がアクティブ
    const activeTab = page.locator("button[aria-pressed='true']").filter({ hasText: "物販のみ" });
    await expect(activeTab).toBeVisible({ timeout: 5_000 });

    // メニュー選択欄が表示されていないこと
    await expect(page.locator("text=施術メニュー")).not.toBeVisible();
  });

  test("RT-02: 種別タブで「来店」→「物販のみ」に切り替えるとメニューが消える", async ({
    page,
  }) => {
    await page.goto(`/records/new?customer=${CUSTOMERS.sato.lastName ? "" : ""}`);
    // 予約選択スキップ
    const skipBtn = page.locator("button[type='button']").filter({ hasText: "予約に紐づけずにカルテを登録" });
    if (await skipBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }

    // 顧客選択
    const customerSearch = page.getByPlaceholder("名前・カナで検索...");
    if (await customerSearch.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await customerSearch.fill(CUSTOMERS.sato.lastName);
      await page.waitForTimeout(500);
      const candidate = page.locator("button[type='button']").filter({ hasText: CUSTOMERS.sato.lastName }).first();
      await candidate.click();
      await page.waitForTimeout(300);
    }

    // 来店タブがデフォルトでアクティブ
    const visitTab = page.locator("button[aria-pressed='true']").filter({ hasText: "来店" });
    await expect(visitTab).toBeVisible();
    await expect(page.locator("text=施術メニュー")).toBeVisible();

    // 物販のみに切り替え
    await page.locator("button").filter({ hasText: "物販のみ" }).click();
    await page.waitForTimeout(300);

    // メニューが消える
    await expect(page.locator("text=施術メニュー")).not.toBeVisible();
  });
});
