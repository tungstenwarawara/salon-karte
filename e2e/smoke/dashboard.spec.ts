import { test, expect } from "@playwright/test";

test.describe("@smoke スモーク: 主要ページ表示確認", () => {
  test("S-02: /customers が表示される", async ({ page }) => {
    await page.goto("/customers");
    await expect(page).toHaveURL(/\/customers/);
    // 顧客一覧 or 空状態が表示される
    await expect(page.locator("body")).toContainText(/顧客/, { timeout: 10_000 });
  });

  test("S-03: /records が表示される", async ({ page }) => {
    await page.goto("/records");
    await expect(page).toHaveURL(/\/records/);
    await expect(page.locator("body")).toContainText(/カルテ/, { timeout: 10_000 });
  });

  test("S-04: /appointments が表示される", async ({ page }) => {
    await page.goto("/appointments");
    await expect(page).toHaveURL(/\/appointments/);
    // カレンダー or 予約管理ヘッダーが存在
    await expect(page.locator("body")).toContainText(/予約/, { timeout: 10_000 });
  });

  test("S-05: /sales が表示される", async ({ page }) => {
    await page.goto("/sales");
    await expect(page).toHaveURL(/\/sales/);
    await expect(page.locator("body")).toContainText(/売上/, { timeout: 10_000 });
  });

  test("S-06: /settings が表示される", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator("body")).toContainText(/設定/, { timeout: 10_000 });
  });

  test("S-07: 未認証で /dashboard → /login リダイレクト", async ({ browser, baseURL }) => {
    // storageState を空にして完全に未認証の状態を作る
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto("/dashboard");
    // middleware で /login にリダイレクトされる
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await context.close();
  });
});
