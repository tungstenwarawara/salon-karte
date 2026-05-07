/**
 * E2E テスト共通ヘルパー
 */
import { type Page, type Locator, expect } from "@playwright/test";

/** Toast メッセージが表示されるまで待つ */
export async function waitForToast(page: Page, text?: string) {
  const toast = page.locator('[role="status"], [data-sonner-toast]').first();
  await expect(toast).toBeVisible({ timeout: 10_000 });
  if (text) {
    await expect(toast).toContainText(text);
  }
}

/** パンくずリストの内容を検証 */
export async function expectBreadcrumbs(page: Page, items: string[]) {
  const nav = page.locator("nav[aria-label='パンくず'], nav[aria-label='breadcrumb']").first();
  for (const item of items) {
    await expect(nav).toContainText(item);
  }
}

/** ErrorAlert コンポーネントの表示を検証 */
export async function expectErrorAlert(page: Page, message?: string) {
  const alert = page.locator('[role="alert"]').first();
  await expect(alert).toBeVisible({ timeout: 5_000 });
  if (message) {
    await expect(alert).toContainText(message);
  }
}

/** フォーム送信ボタンの二重送信防止を検証 */
export async function expectSubmitDisabledWhileLoading(submitButton: Locator) {
  await submitButton.click();
  // クリック直後に disabled になる
  await expect(submitButton).toBeDisabled({ timeout: 2_000 });
}

/** 削除確認パネルで「削除する」を押す */
export async function confirmDelete(page: Page) {
  const deleteConfirm = page.locator("button").filter({ hasText: "削除する" }).last();
  await deleteConfirm.click();
}

/** ページの読み込み完了を待つ（スケルトン消滅） */
export async function waitForPageLoad(page: Page) {
  // loading.tsx のスケルトンが消えるまで待つ
  const skeleton = page.locator('[data-testid="skeleton"], .animate-pulse').first();
  if (await skeleton.isVisible().catch(() => false)) {
    await expect(skeleton).toBeHidden({ timeout: 10_000 });
  }
}

/** テスト用の一意な名前を生成（CUDテストのクリーンアップ用） */
export function uniqueName(prefix: string): string {
  return `${prefix}_e2e_${Date.now()}`;
}
