import { test, expect } from "@playwright/test";
import { CUSTOMERS } from "../fixtures/test-data";
import { uniqueName } from "../fixtures/test-helpers";

/** 編集ページでデータロード完了を待つ（フォームにデータが入るまで） */
async function waitForEditPageLoad(page: import("@playwright/test").Page) {
  // salonIdがセットされるまで=フォームデータがロードされるまで待つ
  // 姓フィールドに値が入ったらロード完了
  const firstInput = page.locator("input[type='text'], input:not([type])").first();
  await expect(firstInput).not.toHaveValue("", { timeout: 10_000 });
}

/** 編集ページ経由で顧客を削除する */
async function deleteCustomerViaEditPage(page: import("@playwright/test").Page) {
  // データロード完了を待つ
  await waitForEditPageLoad(page);

  // 下にスクロールして削除セクションを表示
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);

  // 「この顧客を削除」ボタンをクリック
  const deleteToggle = page.locator("button").filter({ hasText: /この顧客を削除/ });
  await deleteToggle.click();

  // 確認パネルの「削除する」をクリック
  const confirmBtn = page.locator("button").filter({ hasText: /^削除する$/ });
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  await page.waitForURL(/\/customers$/, { timeout: 10_000 });
}

test.describe("@customers 顧客CRUD", () => {
  test("C-01: 最小項目で顧客登録 → 詳細遷移 → 削除", async ({ page }) => {
    const lastName = uniqueName("テスト");
    const firstName = "太郎";

    await page.goto("/customers/new");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("山田").fill(lastName);
    await page.getByPlaceholder("花子").fill(firstName);
    await page.locator("button[type='submit']").filter({ hasText: /保存/ }).click();

    // 詳細ページに遷移
    await page.waitForURL(/\/customers\/[^/]+$/, { timeout: 10_000 });
    await expect(page.locator("body")).toContainText(lastName);

    // クリーンアップ: 編集ページ経由で削除
    await page.locator("a").filter({ hasText: /編集/ }).first().click();
    await page.waitForURL(/\/edit$/);
    await deleteCustomerViaEditPage(page);
  });

  test("C-12: 顧客編集 → 保存 → 反映確認", async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");

    // 山田花子を検索→詳細へ
    await page.getByPlaceholder(/名前|カナ|検索/).fill(CUSTOMERS.yamada.lastName);
    await page.waitForTimeout(500);
    await page.locator("a[href*='/customers/']").filter({ hasNotText: /顧客を登録/ }).filter({ hasText: CUSTOMERS.yamada.lastName }).first().click();
    await page.waitForURL(/\/customers\/[^/]+$/);

    // 編集ページへ
    await page.locator("a").filter({ hasText: /編集/ }).first().click();
    await page.waitForURL(/\/edit$/);
    await waitForEditPageLoad(page);

    // C-13: プリフィル確認
    const firstInput = page.locator("input[type='text'], input:not([type])").first();
    await expect(firstInput).toHaveValue(CUSTOMERS.yamada.lastName);

    // メモを変更
    const notesField = page.locator("textarea").last();
    const originalValue = await notesField.inputValue();
    const testNote = `E2Eテスト_${Date.now()}`;
    await notesField.fill(testNote);

    await page.locator("button[type='submit']").filter({ hasText: /保存/ }).click();
    await page.waitForURL(/\/customers\/[^/]+$/, { timeout: 10_000 });
    await expect(page.locator("body")).toContainText(testNote);

    // 元に戻す
    await page.locator("a").filter({ hasText: /編集/ }).first().click();
    await page.waitForURL(/\/edit$/);
    await waitForEditPageLoad(page);
    await page.locator("textarea").last().fill(originalValue);
    await page.locator("button[type='submit']").filter({ hasText: /保存/ }).click();
    await page.waitForURL(/\/customers\/[^/]+$/, { timeout: 10_000 });
  });

  test("C-14: 顧客削除 → 一覧遷移", async ({ page }) => {
    // 新規作成
    const lastName = uniqueName("削除用");
    await page.goto("/customers/new");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("山田").fill(lastName);
    await page.getByPlaceholder("花子").fill("太郎");
    await page.locator("button[type='submit']").filter({ hasText: /保存/ }).click();
    await page.waitForURL(/\/customers\/[^/]+$/, { timeout: 10_000 });

    // 編集ページから削除
    await page.locator("a").filter({ hasText: /編集/ }).first().click();
    await page.waitForURL(/\/edit$/);
    await deleteCustomerViaEditPage(page);

    // 一覧に削除した顧客が表示されない
    await expect(page.locator("body")).not.toContainText(lastName);
  });

  test("C-15: 削除確認でキャンセル → 元に戻る", async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");

    // 山田花子を検索→詳細へ
    await page.getByPlaceholder(/名前|カナ|検索/).fill(CUSTOMERS.yamada.lastName);
    await page.waitForTimeout(500);
    await page.locator("a[href*='/customers/']").filter({ hasNotText: /顧客を登録/ }).filter({ hasText: CUSTOMERS.yamada.lastName }).first().click();
    await page.waitForURL(/\/customers\/[^/]+$/);

    await page.locator("a").filter({ hasText: /編集/ }).first().click();
    await page.waitForURL(/\/edit$/);
    await waitForEditPageLoad(page);

    // 下にスクロール
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // 削除セクションを開く
    await page.locator("button").filter({ hasText: /この顧客を削除/ }).click();

    // キャンセル
    await page.locator("button").filter({ hasText: /キャンセル/ }).last().click();

    // まだ編集ページにいる
    await expect(page).toHaveURL(/\/edit$/);
  });
});
