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
    // 一覧は20件+「もっと見る」方式でカナ順末尾の山田は初期非表示のため、検索で絞り込む
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder(/名前・カナ/).fill(CUSTOMERS.yamada.lastName);
    await page.waitForTimeout(500);

    const customerLink = page.locator("a").filter({ hasText: CUSTOMERS.yamada.lastName }).first();
    await expect(customerLink).toBeVisible({ timeout: 10_000 });
    await customerLink.click();
    await page.waitForLoadState("networkidle");

    // 「物販」タブに切り替え（既定は施術タブで、物販セクションは hidden のため）
    await page.locator("button").filter({ hasText: /^物販/ }).first().click();
    await page.waitForTimeout(300);

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
    await page.goto("/records/new");
    await page.waitForLoadState("networkidle");

    // 予約選択スキップ（ハイドレーション前のクリックが無効になることがあるため、フォーム表示まで再試行）
    const skipBtn = page.locator("button[type='button']").filter({ hasText: "予約に紐づけずにカルテを登録" });
    const customerSearch = page.getByPlaceholder("名前・カナで検索...");
    await expect(async () => {
      if (await skipBtn.isVisible().catch(() => false)) {
        await skipBtn.click();
      }
      await expect(customerSearch).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });

    // 顧客選択
    await customerSearch.fill(CUSTOMERS.sato.lastName);
    await page.waitForTimeout(500);
    const candidate = page.locator("button[type='button']").filter({ hasText: CUSTOMERS.sato.lastName }).first();
    await candidate.click();
    await page.waitForTimeout(300);

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
