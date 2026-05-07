import { test, expect } from "@playwright/test";
import { COUNSELING } from "../fixtures/test-data";

/**
 * カウンセリングシート公開ページテスト
 * 認証不要。SUPABASE_SERVICE_ROLE_KEY が必要（Server Component が admin client を使う）。
 */

const skipIfNoServiceKey = !process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("@counseling カウンセリング公開ページ", () => {
  test.skip(() => skipIfNoServiceKey, "SUPABASE_SERVICE_ROLE_KEY が未設定のためスキップ");
  test("CS-01: 回答フォーム表示 — pending状態のトークン", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto(`/c/${COUNSELING.pendingId}`);
    await page.waitForLoadState("networkidle");

    // フォームが表示される（送信ボタンまたは次へボタンがある）
    const hasForm =
      (await page
        .locator("button")
        .filter({ hasText: /次へ|送信/ })
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false)) ||
      (await page
        .locator("input, textarea")
        .first()
        .isVisible({ timeout: 3_000 })
        .catch(() => false));
    expect(hasForm).toBeTruthy();

    await context.close();
  });

  test("CS-E1: 無効なトークン — エラー表示", async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto("/c/invalid-token-e2e-test");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(
      /無効|見つかりません|エラー/
    );

    await context.close();
  });

  test("CS-E2: 回答済みトークン — 完了ページにリダイレクト", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto(`/c/${COUNSELING.submittedId}`);
    await page.waitForLoadState("networkidle");

    // 完了ページにリダイレクト or 完了メッセージが表示
    const isComplete =
      page.url().includes("/complete") ||
      (await page
        .locator("body")
        .textContent()
        .then((t) => t?.includes("ありがとう") || t?.includes("送信済み")));
    expect(isComplete).toBeTruthy();

    await context.close();
  });

  test("CS-03: 完了ページ表示 — 直接アクセス", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto(`/c/${COUNSELING.submittedId}/complete`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(
      /ありがとう|完了|送信/
    );

    await context.close();
  });
});
