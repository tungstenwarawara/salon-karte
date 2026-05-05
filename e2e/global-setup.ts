import { test as setup, expect } from "@playwright/test";
import { TEST_EMAIL, TEST_PASSWORD } from "./fixtures/auth";

const AUTH_FILE = "e2e/.auth/user.json";

/**
 * グローバルセットアップ — テストサロンにログインして storageState を保存
 *
 * このセットアップが一度走れば、以降のすべてのテストはログイン済み状態で始まる。
 * Playwright の `dependencies` 機構で各 project の前に実行される。
 */
setup("テストサロンにログインして認証状態を保存", async ({ page }) => {
  await page.goto("/login");

  await page.fill("#email", TEST_EMAIL);
  await page.fill("#password", TEST_PASSWORD);
  await page.click('button[type="submit"]:has-text("ログイン")');

  // /dashboard に到達できればログイン + サロン紐付けが両方OK
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().storageState({ path: AUTH_FILE });
});
