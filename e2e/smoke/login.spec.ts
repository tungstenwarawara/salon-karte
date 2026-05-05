import { test, expect } from "@playwright/test";

test.describe("スモーク: 認証 + ダッシュボード到達", () => {
  test("ログイン済み状態で /dashboard に到達でき、挨拶が表示される", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    // ダッシュボードに必ず存在する見出し（時間帯ごとの挨拶）
    await expect(page.locator("body")).toContainText(
      /おはようございます|こんにちは|おつかれさまです/
    );
  });
});
