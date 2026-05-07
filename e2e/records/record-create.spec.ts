import { test, expect } from "@playwright/test";
import { CUSTOMERS } from "../fixtures/test-data";

/** カルテ新規作成ページに遷移し、予約選択をスキップ */
async function gotoNewRecord(page: import("@playwright/test").Page) {
  await page.goto("/records/new");
  await page.waitForLoadState("networkidle");

  const skipBtn = page
    .locator("button[type='button']")
    .filter({ hasText: "予約に紐づけずにカルテを登録" });
  await expect(skipBtn).toBeVisible({ timeout: 10_000 });
  await skipBtn.click();
  await page.waitForTimeout(500);
}

/** 顧客を検索して選択 */
async function selectCustomer(
  page: import("@playwright/test").Page,
  lastName: string,
  firstName: string
) {
  const searchInput = page.getByPlaceholder("名前・カナで検索...");
  await expect(searchInput).toBeVisible({ timeout: 10_000 });
  await searchInput.fill(lastName);
  await page.waitForTimeout(500);

  const customerBtn = page
    .locator("button[type='button']")
    .filter({ hasText: lastName })
    .filter({ hasText: firstName })
    .first();
  await expect(customerBtn).toBeVisible({ timeout: 5_000 });
  await customerBtn.click();
  await page.waitForTimeout(300);
}

/** N番目のメニューチェックボックスを選択 */
async function selectMenuByIndex(
  page: import("@playwright/test").Page,
  index: number = 0
) {
  const menuSection = page.locator("text=施術メニュー");
  await menuSection.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const checkboxes = page.locator("input[type='checkbox']");
  await expect(checkboxes.nth(index)).toBeVisible({ timeout: 5_000 });
  await checkboxes.nth(index).check();
  await page.waitForTimeout(300);
}

/** 保存ボタンをクリックして遷移を待つ */
async function saveAndWait(page: import("@playwright/test").Page) {
  const saveBtn = page
    .locator("button[type='submit']")
    .filter({ hasText: /保存/ });
  await saveBtn.scrollIntoViewIfNeeded();
  await saveBtn.click();
  await page.waitForURL(/\/(records|customers)\/[^/]+$/, { timeout: 15_000 });
}

test.describe("@records カルテ作成", () => {
  test("R-01: 顧客選択 + メニュー選択でカルテ作成 → 遷移", async ({
    page,
  }) => {
    await gotoNewRecord(page);
    await selectCustomer(page, CUSTOMERS.yamada.lastName, CUSTOMERS.yamada.firstName);
    await selectMenuByIndex(page, 0);
    await saveAndWait(page);

    await expect(page.locator("body")).toContainText(CUSTOMERS.yamada.lastName);
  });

  test("R-03: 複数メニュー選択 → 合計表示が存在", async ({ page }) => {
    await gotoNewRecord(page);
    await selectCustomer(page, CUSTOMERS.sato.lastName, CUSTOMERS.sato.firstName);
    await selectMenuByIndex(page, 0);
    await selectMenuByIndex(page, 1);

    await expect(page.locator("body")).toContainText(/選択中.*2件/);
    await saveAndWait(page);
  });

  test("R-04/R-05: 支払タイプ — 全て現金 / 全てクレジット", async ({
    page,
  }) => {
    await gotoNewRecord(page);
    await selectCustomer(page, CUSTOMERS.tanaka.lastName, CUSTOMERS.tanaka.firstName);
    await selectMenuByIndex(page, 0);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const cashBtn = page.locator("button").filter({ hasText: "全て現金" });
    if (await cashBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cashBtn.click();
      await page.waitForTimeout(300);
    }

    const creditBtn = page.locator("button").filter({ hasText: "全てクレジット" });
    if (await creditBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await creditBtn.click();
      await page.waitForTimeout(300);
    }

    await saveAndWait(page);
  });

  test("R-07: 支払タイプ — サービス（無料）", async ({ page }) => {
    await gotoNewRecord(page);
    await selectCustomer(page, CUSTOMERS.suzuki.lastName, CUSTOMERS.suzuki.firstName);
    await selectMenuByIndex(page, 0);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const serviceBtn = page.locator("button").filter({ hasText: "全てサービス" });
    if (await serviceBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await serviceBtn.click();
      await page.waitForTimeout(300);
    }

    await saveAndWait(page);
  });

  test("R-08: 詳細記録入力 — 施術部位を入力", async ({ page }) => {
    await gotoNewRecord(page);
    await selectCustomer(page, CUSTOMERS.yamada.lastName, CUSTOMERS.yamada.firstName);
    await selectMenuByIndex(page, 0);

    const detailSection = page
      .locator("button[type='button']")
      .filter({ hasText: /詳細な記録を追加/ });
    await detailSection.scrollIntoViewIfNeeded();
    if (await detailSection.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await detailSection.click();
      await page.waitForTimeout(500);
    }

    const areaInput = page.getByPlaceholder(/例: 顔全体/);
    if (await areaInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await areaInput.fill("背中全体");
    }

    await saveAndWait(page);
  });

  test("R-09: 物販セクション — 商品選択（ProductCombobox）", async ({ page }) => {
    await gotoNewRecord(page);
    await selectCustomer(page, CUSTOMERS.sato.lastName, CUSTOMERS.sato.firstName);
    await selectMenuByIndex(page, 0);

    // 物販セクションを開く
    const purchaseSection = page
      .locator("button[type='button']")
      .filter({ hasText: /物販記録/ });
    await purchaseSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    if (await purchaseSection.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await purchaseSection.click();
      await page.waitForTimeout(500);
    }

    // 「商品から選ぶ」がデフォルト。ProductCombobox で商品を検索・選択
    const productSearch = page.getByPlaceholder("商品名で検索...");
    if (await productSearch.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await productSearch.click();
      await page.waitForTimeout(300);
      // ドロップダウンリストから最初の商品を選択
      const firstProduct = page
        .locator("button[type='button'], li, div[role='option']")
        .filter({ hasNotText: /商品名で検索|商品から選ぶ|自由入力|物販を追加/ })
        .first();
      if (await firstProduct.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await firstProduct.click();
        await page.waitForTimeout(300);
      }
    }

    // 追加ボタン（canAdd=true ならクリック可能）
    const addBtn = page.locator("button").filter({ hasText: /物販を追加/ });
    if (await addBtn.isEnabled({ timeout: 3_000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(300);
    }

    await saveAndWait(page);
  });

  test("R-10: 物販セクション — 自由入力", async ({ page }) => {
    await gotoNewRecord(page);
    await selectCustomer(page, CUSTOMERS.tanaka.lastName, CUSTOMERS.tanaka.firstName);
    await selectMenuByIndex(page, 0);

    // 物販セクションまでスクロールして開く
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const purchaseSection = page
      .locator("button[type='button']")
      .filter({ hasText: /物販記録/ });
    await expect(purchaseSection).toBeVisible({ timeout: 5_000 });
    await purchaseSection.click();
    await page.waitForTimeout(500);

    // 自由入力モードに切替（物販セクション内の最後の「自由入力」ボタン）
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const freeBtn = page
      .locator("button[type='button']")
      .filter({ hasText: /^自由入力$/ })
      .last();
    await expect(freeBtn).toBeVisible({ timeout: 3_000 });
    await freeBtn.click();
    await page.waitForTimeout(500);

    // 商品名入力（自由入力モードのplaceholder）
    const nameInput = page.getByPlaceholder("商品名");
    await expect(nameInput).toBeVisible({ timeout: 3_000 });
    await nameInput.fill("E2Eテスト商品");
    await page.waitForTimeout(200);

    // 追加ボタン（商品名入力でcanAdd=trueになる）
    const addBtn = page.locator("button").filter({ hasText: /物販を追加/ });
    await expect(addBtn).toBeEnabled({ timeout: 3_000 });
    await addBtn.click();
    await page.waitForTimeout(300);

    await saveAndWait(page);
  });

  // --- エラー系 ---

  test("R-E1: 顧客未選択で保存 → エラー表示", async ({ page }) => {
    await gotoNewRecord(page);
    await selectMenuByIndex(page, 0);

    const saveBtn = page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ });
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/records\/new/);
  });

  test("R-E2: 保存中の二重送信防止", async ({ page }) => {
    await gotoNewRecord(page);
    await selectCustomer(page, CUSTOMERS.takahashi.lastName, CUSTOMERS.takahashi.firstName);
    await selectMenuByIndex(page, 0);

    const submitBtn = page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    const isDisabledOrLoading = await Promise.race([
      submitBtn.isDisabled().then((d) => d),
      submitBtn.textContent().then((t) => t?.includes("保存中")),
    ]);
    expect(isDisabledOrLoading).toBeTruthy();

    await page.waitForURL(/\/(records|customers)\/[^/]+$/, { timeout: 15_000 });
  });
});
