import { test, expect } from "@playwright/test";

test.describe("@smoke スモーク: 認証 + ダッシュボード到達", () => {
  test("S-01: ログイン済み状態で /dashboard に到達でき、挨拶が表示される", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("body")).toContainText(
      /おはようございます|こんにちは|おつかれさまです/
    );
  });

  test("S-08: ダッシュボード KPI カードが表示される", async ({ page }) => {
    await page.goto("/dashboard");
    // サマリーカード（顧客数・売上・予約）が存在する
    await expect(page.locator("body")).toContainText(/顧客/, { timeout: 10_000 });
  });
});
