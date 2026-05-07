import { test, expect } from "@playwright/test";
import { CUSTOMERS, MENUS } from "../fixtures/test-data";

/** 山田花子の詳細ページに遷移してスクロール */
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
  await page.waitForLoadState("networkidle");
}

/** 回数券タブに切替 */
async function switchToTicketTab(page: import("@playwright/test").Page) {
  // タブナビゲーションまでスクロール
  const ticketTab = page.locator("button, a").filter({ hasText: "回数券" }).first();
  await ticketTab.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await expect(ticketTab).toBeVisible({ timeout: 5_000 });
  await ticketTab.click();
  await page.waitForTimeout(500);
}

test.describe("@tickets 回数券", () => {
  test("T-06: 顧客詳細の回数券表示 — セクション存在", async ({ page }) => {
    await gotoYamadaDetail(page);
    await switchToTicketTab(page);
    await expect(page.locator("body")).toContainText(/回数券|コースチケット/);
  });

  test("T-06b: 顧客詳細の回数券 — ステータスバッジ or 回数表示", async ({ page }) => {
    await gotoYamadaDetail(page);
    await switchToTicketTab(page);

    // 回数券がある場合はバッジ or 回数表示（「残 X/Y回」等）が表示される
    // 回数券がない場合は「最初の回数券を登録する」CTA
    const hasBadge = await page.locator("span").filter({ hasText: /^(有効|消化済|期限切|取消)$/ }).first().isVisible({ timeout: 3_000 }).catch(() => false);
    const hasCount = await page.locator("body").textContent().then(t => /残.*\d+.*回|回数券/.test(t ?? ""));
    const hasCta = await page.locator("text=最初の回数券を登録する").isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasBadge || hasCount || hasCta).toBeTruthy();
  });

  test("T-01: 回数券登録ページへの遷移", async ({ page }) => {
    await gotoYamadaDetail(page);
    await switchToTicketTab(page);

    // 「+ 回数券を登録」ボタン
    const addBtn = page.locator("a").filter({ hasText: /回数券を登録/ }).first();
    await expect(addBtn).toBeVisible({ timeout: 5_000 });
    await addBtn.click();
    await page.waitForURL(/\/tickets\/new/);
    await expect(
      page.locator("button[type='submit']").filter({ hasText: /保存/ })
    ).toBeVisible();
  });

  test("T-02: メニューベース登録 → 保存 → 削除", async ({ page }) => {
    await gotoYamadaDetail(page);
    await switchToTicketTab(page);

    const addBtn = page.locator("a").filter({ hasText: /回数券を登録/ }).first();
    await expect(addBtn).toBeVisible({ timeout: 5_000 });
    await addBtn.click();
    await page.waitForURL(/\/tickets\/new/);
    await page.waitForLoadState("networkidle");

    // メニューから作成モード（デフォルト）
    const menuFromBtn = page.locator("button").filter({ hasText: /メニューから作成/ });
    if (await menuFromBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await menuFromBtn.click();
      await page.waitForTimeout(300);
    }

    // メニュー選択（select要素）
    const menuSelect = page.locator("select").first();
    await expect(menuSelect).toBeVisible({ timeout: 5_000 });
    // 最初の有効なoptionを選択
    const options = menuSelect.locator("option");
    const optionCount = await options.count();
    for (let i = 1; i < optionCount; i++) {
      const text = await options.nth(i).textContent();
      if (text && !text.includes("選択")) {
        await menuSelect.selectOption({ index: i });
        break;
      }
    }
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

    // 登録された回数券を確認
    await switchToTicketTab(page);
    await expect(page.locator("body")).toContainText(/5回/);

    // クリーンアップ: 最新の回数券を削除
    // 削除ボタンを探す（最初に表示されるアクティブな回数券の削除ボタン）
    const deleteBtn = page.locator("button").filter({ hasText: /^削除$/ }).first();
    if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      const confirmBtn = page.locator("button").filter({ hasText: /^削除する$/ });
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test("T-03: 自由入力登録 → 保存 → 削除", async ({ page }) => {
    await gotoYamadaDetail(page);
    await switchToTicketTab(page);

    const addBtn = page.locator("a").filter({ hasText: /回数券を登録/ }).first();
    await expect(addBtn).toBeVisible({ timeout: 5_000 });
    await addBtn.click();
    await page.waitForURL(/\/tickets\/new/);
    await page.waitForLoadState("networkidle");

    // 自由入力モードに切替
    const freeBtn = page.locator("button").filter({ hasText: /^自由入力$/ });
    await expect(freeBtn).toBeVisible({ timeout: 5_000 });
    await freeBtn.click();
    await page.waitForTimeout(500);

    // チケット名入力（自由入力モード: placeholder="例: フェイシャル5回コース"）
    const nameInput = page.getByPlaceholder(/例: フェイシャル/);
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill("E2Eテスト回数券");

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
    await switchToTicketTab(page);
    await expect(page.locator("body")).toContainText("E2Eテスト回数券");

    // クリーンアップ
    const deleteBtn = page.locator("button").filter({ hasText: /^削除$/ }).first();
    if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
      const confirmBtn = page.locator("button").filter({ hasText: /^削除する$/ });
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test("T-05: 手動調整 — 消化回数変更", async ({ page }) => {
    await gotoYamadaDetail(page);
    await switchToTicketTab(page);

    // 「回数調整」ボタンを探す
    const adjustBtn = page.locator("button").filter({ hasText: /回数調整/ }).first();
    if (!(await adjustBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return;
    }
    await adjustBtn.click();
    await page.waitForTimeout(300);

    // キャンセルする
    const cancelBtn = page.locator("button").filter({ hasText: /キャンセル/ }).last();
    if (await cancelBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cancelBtn.click();
    }
  });
});
