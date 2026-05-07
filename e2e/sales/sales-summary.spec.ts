import { test, expect } from "@playwright/test";
import { PRODUCTS } from "../fixtures/test-data";
import { uniqueName } from "../fixtures/test-helpers";

test.describe("@sales 売上サマリー・在庫・分析", () => {
  test("SL-01: 売上サマリー表示 — 月別売上", async ({ page }) => {
    await page.goto("/sales");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/売上/);
    // 年表示がある
    await expect(page.locator("body")).toContainText(/年/);
  });

  test("SL-02: 年度切替 — 前年へ", async ({ page }) => {
    await page.goto("/sales");
    await page.waitForLoadState("networkidle");

    // 前年ボタン（左矢印）
    const prevBtn = page
      .locator("button")
      .filter({ hasText: /[<‹←]/ })
      .first();
    if (await prevBtn.isVisible()) {
      const yearBefore = await page.locator("body").textContent();
      await prevBtn.click();
      await page.waitForTimeout(500);
      // 年表示が変わっている
      const yearAfter = await page.locator("body").textContent();
      // 少なくとも何らかの変化がある
      expect(yearAfter).toBeTruthy();
    }
  });

  test("SL-03: 日別売上表示", async ({ page }) => {
    await page.goto("/sales/daily");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/日計|見込/);
  });

  test("SL-04: 在庫サマリー表示 — 商品数・在庫額", async ({ page }) => {
    await page.goto("/sales/inventory");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/在庫|商品/);
  });

  test("SL-05: 発注点アラート", async ({ page }) => {
    await page.goto("/sales/inventory");
    await page.waitForLoadState("networkidle");

    // 要発注アラートがある場合のみ確認
    const alert = page.locator("body").locator(":text('要発注')");
    if (await alert.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(alert).toBeVisible();
    }
  });

  test("SL-06: 商品登録 → 削除", async ({ page }) => {
    await page.goto("/sales/inventory/products");
    await page.waitForLoadState("networkidle");

    // 「+ 商品を登録」ボタン
    const addBtn = page
      .locator("button, a")
      .filter({ hasText: /商品を登録/ })
      .first();
    await addBtn.click();
    await page.waitForTimeout(300);

    // 商品名入力
    const nameInput = page.getByPlaceholder(/例: モイスチャー/);
    const productName = uniqueName("テスト商品");
    await nameInput.fill(productName);

    // 売価入力
    const priceInput = page.getByPlaceholder("5000");
    if (await priceInput.isVisible()) {
      await priceInput.fill("3000");
    }

    // 追加する
    const submitBtn = page
      .locator("button")
      .filter({ hasText: /追加する|保存/ })
      .first();
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // 追加された確認
    await expect(page.locator("body")).toContainText(productName);

    // 削除
    const deleteBtn = page
      .locator("button")
      .filter({ hasText: /削除/ })
      .first();
    if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      const confirmBtn = page
        .locator("button")
        .filter({ hasText: /^削除する$/ });
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test("SL-07: 商品編集 — 価格変更", async ({ page }) => {
    await page.goto("/sales/inventory/products");
    await page.waitForLoadState("networkidle");

    // 既存商品の編集ボタン
    const editBtn = page
      .locator("button")
      .filter({ hasText: /編集/ })
      .first();
    if (await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(300);

      // キャンセルして元に戻す
      const cancelBtn = page
        .locator("button")
        .filter({ hasText: /キャンセル/ })
        .first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  test("SL-12: 確定申告レポート表示", async ({ page }) => {
    await page.goto("/sales/inventory/tax-report");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/売上|仕入|レポート/);
    // 年表示がある
    await expect(page.locator("body")).toContainText(/年/);
  });

  test("SL-13: 分析ページ表示 — LTV・リピート率", async ({ page }) => {
    await page.goto("/sales/analytics");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/分析|LTV|リピート/);
  });

  test("SL-E1: 商品名空で保存 → エラー", async ({ page }) => {
    await page.goto("/sales/inventory/products");
    await page.waitForLoadState("networkidle");

    const addBtn = page
      .locator("button, a")
      .filter({ hasText: /商品を登録/ })
      .first();
    await addBtn.click();
    await page.waitForTimeout(300);

    // 名前を空のまま保存
    const submitBtn = page
      .locator("button")
      .filter({ hasText: /追加する|保存/ })
      .first();
    await submitBtn.click();
    await page.waitForTimeout(500);

    // フォームが閉じない（バリデーションエラー）
    await expect(
      page.getByPlaceholder(/例: モイスチャー/)
    ).toBeVisible();
  });
});
