import { test, expect } from "@playwright/test";
import { CUSTOMERS, MENUS, PRODUCTS } from "../fixtures/test-data";
import { uniqueName, waitForToast } from "../fixtures/test-helpers";

/** カルテ新規作成ページに直接遷移（予約選択をスキップ） */
async function gotoNewRecordWithCustomer(
  page: import("@playwright/test").Page
) {
  await page.goto("/records/new");
  await page.waitForLoadState("networkidle");

  // 予約選択ステップが表示されたらスキップ
  const skipBtn = page
    .locator("button, a")
    .filter({ hasText: /予約に紐づけずにカルテを登録/ });
  if (await skipBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

/** 顧客を検索して選択 */
async function selectCustomer(
  page: import("@playwright/test").Page,
  name: string
) {
  const searchInput = page.getByPlaceholder(/名前・カナで検索/);
  await searchInput.fill(name);
  await page.waitForTimeout(500);
  // 検索結果から選択
  await page.locator("button, div").filter({ hasText: name }).first().click();
  await page.waitForTimeout(300);
}

/** メニューをチェックボックスで選択 */
async function selectMenu(
  page: import("@playwright/test").Page,
  menuName: string
) {
  const menuLabel = page
    .locator("label, div")
    .filter({ hasText: menuName })
    .first();
  const checkbox = menuLabel.locator("input[type='checkbox']");
  if ((await checkbox.count()) > 0) {
    await checkbox.check();
  } else {
    await menuLabel.click();
  }
  await page.waitForTimeout(300);
}

/** 保存ボタンをクリック */
async function clickSave(page: import("@playwright/test").Page) {
  await page
    .locator("button[type='submit']")
    .filter({ hasText: /保存/ })
    .click();
}

/** カルテ詳細ページから編集ページに遷移して削除 */
async function deleteRecordFromDetail(
  page: import("@playwright/test").Page
) {
  // 編集ボタンクリック
  await page.locator("a").filter({ hasText: /編集/ }).first().click();
  await page.waitForURL(/\/edit$/);
  await page.waitForLoadState("networkidle");

  // 下にスクロール
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);

  // 削除セクションを開く
  const deleteToggle = page
    .locator("button")
    .filter({ hasText: /この記録を削除/ });
  await deleteToggle.click();

  // 確認ボタンをクリック
  const confirmBtn = page.locator("button").filter({ hasText: /^削除する$/ });
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  // リダイレクト待ち
  await page.waitForURL(/\/(customers|dashboard|records)/, { timeout: 10_000 });
}

test.describe("@records カルテ作成", () => {
  test("R-01: 顧客選択 + メニュー選択でカルテ作成 → 詳細遷移 → 削除", async ({
    page,
  }) => {
    await gotoNewRecordWithCustomer(page);

    // 顧客選択
    await selectCustomer(page, CUSTOMERS.yamada.lastName);

    // メニュー選択
    await selectMenu(page, MENUS.facialBasic.name);

    // 保存
    await clickSave(page);

    // 詳細ページに遷移
    await page.waitForURL(/\/records\/[^/]+$/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(CUSTOMERS.yamada.lastName);
    await expect(page.locator("body")).toContainText(MENUS.facialBasic.name);

    // クリーンアップ
    await deleteRecordFromDetail(page);
  });

  test("R-03: 複数メニュー選択 → 合計金額が正しい", async ({ page }) => {
    await gotoNewRecordWithCustomer(page);
    await selectCustomer(page, CUSTOMERS.sato.lastName);

    // 2つのメニューを選択
    await selectMenu(page, MENUS.facialBasic.name);
    await selectMenu(page, MENUS.decollete.name);

    // 合計金額の確認
    const expectedTotal = MENUS.facialBasic.price + MENUS.decollete.price;
    await expect(page.locator("body")).toContainText(
      expectedTotal.toLocaleString()
    );

    // 保存
    await clickSave(page);
    await page.waitForURL(/\/records\/[^/]+$/, { timeout: 15_000 });

    // 両メニューが詳細に表示
    await expect(page.locator("body")).toContainText(MENUS.facialBasic.name);
    await expect(page.locator("body")).toContainText(MENUS.decollete.name);

    // クリーンアップ
    await deleteRecordFromDetail(page);
  });

  test("R-04/R-05: 支払タイプ選択 — 全て現金 / 全てクレジット", async ({
    page,
  }) => {
    await gotoNewRecordWithCustomer(page);
    await selectCustomer(page, CUSTOMERS.tanaka.lastName);
    await selectMenu(page, MENUS.facialBasic.name);

    // 全て現金
    const cashBtn = page.locator("button").filter({ hasText: "全て現金" });
    if (await cashBtn.isVisible().catch(() => false)) {
      await cashBtn.click();
      await page.waitForTimeout(300);
    }

    // 全てクレジット
    const creditBtn = page
      .locator("button")
      .filter({ hasText: "全てクレジット" });
    if (await creditBtn.isVisible().catch(() => false)) {
      await creditBtn.click();
      await page.waitForTimeout(300);
    }

    // 保存
    await clickSave(page);
    await page.waitForURL(/\/records\/[^/]+$/, { timeout: 15_000 });

    // クリーンアップ
    await deleteRecordFromDetail(page);
  });

  test("R-07: 支払タイプ選択 — サービス（無料）", async ({ page }) => {
    await gotoNewRecordWithCustomer(page);
    await selectCustomer(page, CUSTOMERS.suzuki.lastName);
    await selectMenu(page, MENUS.decollete.name);

    // 全てサービス
    const serviceBtn = page
      .locator("button")
      .filter({ hasText: "全てサービス" });
    if (await serviceBtn.isVisible().catch(() => false)) {
      await serviceBtn.click();
      await page.waitForTimeout(300);
    }

    await clickSave(page);
    await page.waitForURL(/\/records\/[^/]+$/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/サービス/);

    // クリーンアップ
    await deleteRecordFromDetail(page);
  });

  test("R-08: 詳細記録入力 — 施術前の状態・メモ等", async ({ page }) => {
    await gotoNewRecordWithCustomer(page);
    await selectCustomer(page, CUSTOMERS.yamada.lastName);
    await selectMenu(page, MENUS.bodyRelax.name);

    // 詳細セクションを開く
    const detailSection = page
      .locator("button")
      .filter({ hasText: /詳細な記録を追加/ });
    if (await detailSection.isVisible().catch(() => false)) {
      await detailSection.click();
      await page.waitForTimeout(300);
    }

    // 施術部位
    const areaInput = page.getByPlaceholder(/例: 顔全体/);
    if (await areaInput.isVisible().catch(() => false)) {
      await areaInput.fill("背中全体");
    }

    // 施術前の状態
    const conditionInput = page.getByPlaceholder(/施術前の状態を記録/);
    if (await conditionInput.isVisible().catch(() => false)) {
      await conditionInput.fill("E2Eテスト 施術前状態");
    }

    await clickSave(page);
    await page.waitForURL(/\/records\/[^/]+$/, { timeout: 15_000 });

    // 詳細に反映
    await expect(page.locator("body")).toContainText("背中全体");

    // クリーンアップ
    await deleteRecordFromDetail(page);
  });

  test("R-09: 物販セクション — 商品選択", async ({ page }) => {
    await gotoNewRecordWithCustomer(page);
    await selectCustomer(page, CUSTOMERS.sato.lastName);
    await selectMenu(page, MENUS.facialBasic.name);

    // 物販セクションを開く
    const purchaseSection = page
      .locator("button")
      .filter({ hasText: /物販/ });
    if (await purchaseSection.isVisible().catch(() => false)) {
      await purchaseSection.click();
      await page.waitForTimeout(300);
    }

    // 商品から選ぶモード
    const fromProductBtn = page
      .locator("button")
      .filter({ hasText: "商品から選ぶ" });
    if (await fromProductBtn.isVisible().catch(() => false)) {
      await fromProductBtn.click();
      await page.waitForTimeout(300);
    }

    // 商品を選択（セレクトボックスまたはボタン）
    const productSelect = page.locator("select").filter({ hasText: PRODUCTS.lotion.name });
    if (await productSelect.count() > 0) {
      await productSelect.selectOption({ label: PRODUCTS.lotion.name });
    } else {
      // ボタン式の場合
      const productBtn = page
        .locator("button, div")
        .filter({ hasText: PRODUCTS.lotion.name })
        .first();
      if (await productBtn.isVisible().catch(() => false)) {
        await productBtn.click();
      }
    }
    await page.waitForTimeout(300);

    // 追加ボタン
    const addPurchaseBtn = page
      .locator("button")
      .filter({ hasText: /物販を追加/ });
    if (await addPurchaseBtn.isVisible().catch(() => false)) {
      await addPurchaseBtn.click();
      await page.waitForTimeout(300);
    }

    await clickSave(page);
    await page.waitForURL(/\/records\/[^/]+$/, { timeout: 15_000 });

    // クリーンアップ
    await deleteRecordFromDetail(page);
  });

  test("R-10: 物販セクション — 自由入力", async ({ page }) => {
    await gotoNewRecordWithCustomer(page);
    await selectCustomer(page, CUSTOMERS.tanaka.lastName);
    await selectMenu(page, MENUS.facialBasic.name);

    // 物販セクションを開く
    const purchaseSection = page
      .locator("button")
      .filter({ hasText: /物販/ });
    if (await purchaseSection.isVisible().catch(() => false)) {
      await purchaseSection.click();
      await page.waitForTimeout(300);
    }

    // 自由入力モード
    const freeInputBtn = page
      .locator("button")
      .filter({ hasText: "自由入力" })
      .first();
    if (await freeInputBtn.isVisible().catch(() => false)) {
      await freeInputBtn.click();
      await page.waitForTimeout(300);
    }

    // 商品名入力
    const nameInput = page.getByPlaceholder("商品名");
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill("E2Eテスト商品");
    }

    // 単価入力
    const priceInput = page.locator("input[type='number']").last();
    if (await priceInput.isVisible().catch(() => false)) {
      await priceInput.fill("3000");
    }

    // 追加ボタン
    const addBtn = page.locator("button").filter({ hasText: /物販を追加/ });
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(300);
    }

    await clickSave(page);
    await page.waitForURL(/\/records\/[^/]+$/, { timeout: 15_000 });

    // クリーンアップ
    await deleteRecordFromDetail(page);
  });

  // --- エラー系 ---

  test("R-E1: 顧客未選択で保存 → エラー表示", async ({ page }) => {
    await gotoNewRecordWithCustomer(page);
    // 顧客を選択せずにメニューだけ選択
    await selectMenu(page, MENUS.facialBasic.name);
    await clickSave(page);

    // エラーが表示されるかURL変わらず
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/records\/new/);
  });

  test("R-E2: 保存中の二重送信防止", async ({ page }) => {
    await gotoNewRecordWithCustomer(page);
    await selectCustomer(page, CUSTOMERS.takahashi.lastName);
    await selectMenu(page, MENUS.headSpa.name);

    const submitBtn = page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ });
    await submitBtn.click();

    // クリック直後に disabled or 「保存中...」
    const isDisabledOrLoading = await Promise.race([
      submitBtn.isDisabled().then((d) => d),
      submitBtn.textContent().then((t) => t?.includes("保存中")),
    ]);
    expect(isDisabledOrLoading).toBeTruthy();

    // クリーンアップ
    await page.waitForURL(/\/records\/[^/]+$/, { timeout: 15_000 });
    await deleteRecordFromDetail(page);
  });
});
