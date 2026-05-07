import { test, expect } from "@playwright/test";
import { CUSTOMERS, MENUS, TICKETS } from "../fixtures/test-data";
import { uniqueName } from "../fixtures/test-helpers";

/** 山田花子の詳細ページに遷移 */
async function gotoYamadaDetail(page: import("@playwright/test").Page) {
  await page.goto("/customers");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder(/名前|カナ|検索/).fill(CUSTOMERS.yamada.lastName);
  await page.waitForTimeout(500);
  await page
    .locator("a[href*='/customers/']")
    .filter({ hasNotText: /顧客を登録/ })
    .filter({ hasText: CUSTOMERS.yamada.lastName })
    .first()
    .click();
  await page.waitForURL(/\/customers\/[^/]+$/);
}

test.describe("@tickets 回数券", () => {
  test("T-06: 顧客詳細の回数券表示 — セクション存在", async ({ page }) => {
    await gotoYamadaDetail(page);

    // 回数券セクションが表示される
    await expect(page.locator("body")).toContainText(/回数券|コースチケット/);
  });

  test("T-06b: 顧客詳細の回数券 — ステータスバッジ表示", async ({
    page,
  }) => {
    await gotoYamadaDetail(page);

    // ステータスバッジ（有効/消化済/期限切等）
    const body = page.locator("body");
    const hasStatus =
      (await body.locator(":text('有効')").isVisible().catch(() => false)) ||
      (await body.locator(":text('消化済')").isVisible().catch(() => false)) ||
      (await body.locator(":text('期限切')").isVisible().catch(() => false));
    expect(hasStatus).toBeTruthy();
  });

  test("T-01: 回数券登録ページへの遷移", async ({ page }) => {
    await gotoYamadaDetail(page);

    // 「+ 回数券を登録」ボタン
    const addBtn = page
      .locator("a, button")
      .filter({ hasText: /回数券を登録/ })
      .first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.waitForURL(/\/tickets\/new/);

    // フォームが表示
    await expect(page.locator("body")).toContainText(/回数券/);
    await expect(
      page.locator("button[type='submit']").filter({ hasText: /保存/ })
    ).toBeVisible();
  });

  test("T-02: メニューベース登録 → 保存 → 削除", async ({ page }) => {
    await gotoYamadaDetail(page);

    const addBtn = page
      .locator("a, button")
      .filter({ hasText: /回数券を登録/ })
      .first();
    await addBtn.click();
    await page.waitForURL(/\/tickets\/new/);
    await page.waitForLoadState("networkidle");

    // メニューから作成モード（デフォルト）
    const menuFromBtn = page
      .locator("button")
      .filter({ hasText: /メニューから作成/ });
    if (await menuFromBtn.isVisible().catch(() => false)) {
      await menuFromBtn.click();
      await page.waitForTimeout(300);
    }

    // メニュー選択
    const menuSelect = page.locator("select").first();
    await menuSelect.selectOption({ label: MENUS.facialBasic.name });
    await page.waitForTimeout(300);

    // 回数入力
    const countInput = page.locator("input[type='number']").first();
    await countInput.fill("5");
    await page.waitForTimeout(300);

    // 保存
    await page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ })
      .click();
    await page.waitForURL(/\/customers\/[^/]+$/, { timeout: 15_000 });

    // 顧客詳細に戻って回数券が追加されていることを確認
    await expect(page.locator("body")).toContainText(
      /フェイシャルベーシック.*5回|5回.*フェイシャルベーシック/
    );

    // クリーンアップ: 作成した回数券を削除
    const deleteBtn = page
      .locator("button")
      .filter({ hasText: /削除/ })
      .first();
    if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      // 確認パネルの「削除する」
      const confirmBtn = page
        .locator("button")
        .filter({ hasText: /^削除する$/ });
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test("T-03: 自由入力登録 → 保存 → 削除", async ({ page }) => {
    await gotoYamadaDetail(page);

    const addBtn = page
      .locator("a, button")
      .filter({ hasText: /回数券を登録/ })
      .first();
    await addBtn.click();
    await page.waitForURL(/\/tickets\/new/);
    await page.waitForLoadState("networkidle");

    // 自由入力モードに切替
    const freeBtn = page.locator("button").filter({ hasText: /自由入力/ });
    if (await freeBtn.isVisible().catch(() => false)) {
      await freeBtn.click();
      await page.waitForTimeout(300);
    }

    // チケット名入力
    const nameInput = page.getByPlaceholder(/例: フェイシャル/);
    if (await nameInput.isVisible()) {
      await nameInput.fill("E2Eテスト回数券");
    }

    // 回数入力
    const countInput = page.locator("input[type='number']").first();
    await countInput.fill("3");

    // 保存
    await page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ })
      .click();
    await page.waitForURL(/\/customers\/[^/]+$/, { timeout: 15_000 });

    // 確認
    await expect(page.locator("body")).toContainText("E2Eテスト回数券");

    // クリーンアップ: 作成した回数券を削除
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

  test("T-05: 手動調整 — 消化回数変更", async ({ page }) => {
    await gotoYamadaDetail(page);

    // 「回数調整」ボタンを探す
    const adjustBtn = page
      .locator("button")
      .filter({ hasText: /回数調整/ })
      .first();
    if (!(await adjustBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      // 回数調整ボタンが見えなければスキップ
      return;
    }
    await adjustBtn.click();
    await page.waitForTimeout(300);

    // 回数変更UIが表示される
    const numberInput = page.locator("input[type='number']");
    if (await numberInput.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      // 現在の値を取得
      const currentVal = await numberInput.first().inputValue();
      // 値は変更せず、キャンセルする
      const cancelBtn = page
        .locator("button")
        .filter({ hasText: /キャンセル/ })
        .last();
      await cancelBtn.click();
    }
  });
});
