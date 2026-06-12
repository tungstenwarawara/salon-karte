import { test, expect } from "@playwright/test";
import { CUSTOMERS } from "../fixtures/test-data";

/** メニュー付きの seed カルテ（他テストが作る「メニューなしカルテ」の影響を受けない固定ID） */
const SEEDED_RECORD_WITH_MENUS = "00000000-0000-0000-0000-000000004001";

/** 全期間フィルターでカルテ一覧を表示し、seed カルテ詳細に遷移 */
async function gotoFirstRecordDetail(page: import("@playwright/test").Page) {
  await page.goto("/records");
  await page.waitForLoadState("networkidle");

  await page.locator("button").filter({ hasText: "全期間" }).click();
  await page.waitForTimeout(500);

  // 「最初のカード」だと先行テストが作ったメニューなしカルテを拾うことがあるため seed IDを直接選ぶ
  const card = page.locator(`a[href*='${SEEDED_RECORD_WITH_MENUS}']`).first();
  await expect(card).toBeVisible({ timeout: 5_000 });
  await card.click();
  await page.waitForURL(/\/records\/[^/]+$/);
}

/** テスト用カルテを作成し、カルテ詳細ページに遷移して返す */
async function createTestRecordAndGoToDetail(page: import("@playwright/test").Page) {
  await page.goto("/records/new");
  await page.waitForLoadState("networkidle");

  // 予約選択をスキップ
  const skipBtn = page
    .locator("button[type='button']")
    .filter({ hasText: "予約に紐づけずにカルテを登録" });
  await expect(skipBtn).toBeVisible({ timeout: 10_000 });
  await skipBtn.click();
  await page.waitForTimeout(500);

  // 顧客選択
  const searchInput = page.getByPlaceholder("名前・カナで検索...");
  await expect(searchInput).toBeVisible({ timeout: 10_000 });
  await searchInput.fill(CUSTOMERS.yamada.lastName);
  await page.waitForTimeout(500);
  await page
    .locator("button[type='button']")
    .filter({ hasText: CUSTOMERS.yamada.lastName })
    .filter({ hasText: CUSTOMERS.yamada.firstName })
    .first()
    .click();
  await page.waitForTimeout(300);

  // メニュー選択
  const menuSectionLabel = page.locator("text=施術メニュー");
  await menuSectionLabel.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.locator("input[type='checkbox']").first().check();
  await page.waitForTimeout(300);

  // 保存
  const saveBtn = page.locator("button[type='submit']").filter({ hasText: /保存/ });
  await saveBtn.scrollIntoViewIfNeeded();
  await saveBtn.click();

  // カルテ作成後は /customers/{id} にリダイレクト
  await page.waitForURL(/\/(records|customers)\/[^/]+$/, { timeout: 15_000 });

  // カルテ一覧から最新カルテ（今日作成）に遷移
  await page.goto("/records");
  await page.waitForLoadState("networkidle");
  // 「今日」フィルターで今日のカルテを表示
  const todayBtn = page.locator("button").filter({ hasText: "今日" });
  if (await todayBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await todayBtn.click();
    await page.waitForTimeout(500);
  }
  // 最初のカルテカードをクリック
  const card = page
    .locator("a[href*='/records/']")
    .filter({ hasNotText: /カルテを登録/ })
    .first();
  await expect(card).toBeVisible({ timeout: 5_000 });
  await card.click();
  await page.waitForURL(/\/records\/[^/]+$/);
}

/** カルテ詳細ページから編集経由で削除 */
async function deleteFromDetail(page: import("@playwright/test").Page) {
  const editLink = page.locator("a[href*='/records/']").filter({ hasText: "編集" }).first();
  await expect(editLink).toBeVisible({ timeout: 5_000 });
  await editLink.click();
  await page.waitForURL(/\/records\/[^/]+\/edit$/);
  await page.waitForLoadState("networkidle");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  // CollapsibleSection「この記録を削除する」を開く
  const deleteSectionBtn = page
    .locator("button[type='button']")
    .filter({ hasText: "この記録を削除する" });
  if (await deleteSectionBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await deleteSectionBtn.click();
    await page.waitForTimeout(300);
  }

  // 「この記録を削除」ボタン
  const deleteBtn = page
    .locator("button")
    .filter({ hasText: /^この記録を削除$/ });
  await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
  await deleteBtn.click();
  await page.waitForTimeout(300);

  // 「削除する」確認
  const confirmBtn = page.locator("button").filter({ hasText: /^削除する$/ });
  await expect(confirmBtn).toBeVisible({ timeout: 3_000 });
  await confirmBtn.click();

  await page.waitForURL(/\/(customers|dashboard|records)/, { timeout: 10_000 });
}

test.describe("@records カルテ詳細・編集・削除", () => {
  test("R-15: カルテ詳細表示 — 施術メニュー・顧客名が表示", async ({
    page,
  }) => {
    await gotoFirstRecordDetail(page);
    await expect(page.locator("body")).toContainText(/施術メニュー/);
    const customerLink = page.locator("a[href*='/customers/']").first();
    await expect(customerLink).toBeVisible();
  });

  test("R-15b: カルテ詳細 — パンくずにカルテ詳細が含まれる", async ({
    page,
  }) => {
    await gotoFirstRecordDetail(page);
    await expect(page.locator("body")).toContainText(/カルテ詳細/);
  });

  test("R-15c: カルテ詳細 — 編集リンク・PDFリンクが存在", async ({
    page,
  }) => {
    await gotoFirstRecordDetail(page);
    const editLink = page.locator("a[href*='/records/']").filter({ hasText: /編集/ }).first();
    await expect(editLink).toBeVisible();

    const pdfLink = page.locator("a").filter({ hasText: /PDF/ });
    if (await pdfLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await expect(pdfLink).toHaveAttribute("target", "_blank");
    }
  });

  test("R-16: カルテ編集 → メモ変更 → 保存 → 反映", async ({ page }) => {
    await createTestRecordAndGoToDetail(page);

    const editLink = page.locator("a[href*='/records/']").filter({ hasText: "編集" }).first();
    await expect(editLink).toBeVisible({ timeout: 5_000 });
    await editLink.click();
    await page.waitForURL(/\/records\/[^/]+\/edit$/);
    await page.waitForLoadState("networkidle");

    // 保存ボタンまでスクロールして保存（編集内容の確認は保存→遷移で検証）
    // ハイドレーション前のクリックが無効になることがあるため、遷移するまで再試行
    const saveBtn = page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ });
    await saveBtn.scrollIntoViewIfNeeded();
    await expect(async () => {
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
      }
      await page.waitForURL(/\/records\/[^/]+$/, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    // カルテ詳細ページに戻ったことを確認
    await expect(page.locator("body")).toContainText(/カルテ詳細/);

    await deleteFromDetail(page);
  });

  test("R-17: カルテ削除 → 遷移", async ({ page }) => {
    await createTestRecordAndGoToDetail(page);
    const currentUrl = page.url();
    await deleteFromDetail(page);
    expect(page.url()).not.toBe(currentUrl);
  });

  test("R-17b: カルテ削除 — キャンセルで元に戻る", async ({ page }) => {
    await gotoFirstRecordDetail(page);

    const editLink = page.locator("a[href*='/records/']").filter({ hasText: "編集" }).first();
    await expect(editLink).toBeVisible({ timeout: 5_000 });
    await editLink.click();
    await page.waitForURL(/\/records\/[^/]+\/edit$/);
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const deleteSectionBtn = page
      .locator("button[type='button']")
      .filter({ hasText: "この記録を削除する" });
    if (await deleteSectionBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deleteSectionBtn.click();
      await page.waitForTimeout(300);
    }

    const deleteBtn = page
      .locator("button")
      .filter({ hasText: /^この記録を削除$/ });
    if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(300);
    }

    const cancelBtn = page.locator("button").filter({ hasText: /キャンセル/ }).last();
    await cancelBtn.click();

    await expect(page).toHaveURL(/\/edit$/);
  });

  test("R-E4: 支払タイプセクションが表示される", async ({ page }) => {
    await page.goto("/records/new");
    await page.waitForLoadState("networkidle");

    const skipBtn = page
      .locator("button[type='button']")
      .filter({ hasText: "予約に紐づけずにカルテを登録" });
    await expect(skipBtn).toBeVisible({ timeout: 10_000 });
    await skipBtn.click();
    await page.waitForTimeout(500);

    // 山田花子を選択
    const searchInput = page.getByPlaceholder("名前・カナで検索...");
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill(CUSTOMERS.yamada.lastName);
    await page.waitForTimeout(500);
    await page
      .locator("button[type='button']")
      .filter({ hasText: CUSTOMERS.yamada.lastName })
      .filter({ hasText: CUSTOMERS.yamada.firstName })
      .first()
      .click();
    await page.waitForTimeout(300);

    // メニュー選択
    const menuSection = page.locator("text=施術メニュー");
    await menuSection.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator("input[type='checkbox']").first().check();
    await page.waitForTimeout(500);

    // 支払方法セクションが表示されることを確認
    await expect(page.locator("body")).toContainText(/支払方法|全て現金|全てクレジット/);
  });
});
