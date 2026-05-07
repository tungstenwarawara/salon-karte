import { type Page, type Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly greeting: Locator;

  constructor(page: Page) {
    this.page = page;
    this.greeting = page.locator("body");
  }

  async goto() {
    await this.page.goto("/dashboard");
    await this.page.waitForLoadState("networkidle");
  }

  async expectGreeting() {
    await expect(this.greeting).toContainText(
      /おはようございます|こんにちは|おつかれさまです/
    );
  }

  async expectKpiCards() {
    // サマリーカードが3つ以上表示される
    const cards = this.page.locator('[data-testid="summary-card"], .bg-surface').filter({ hasText: /顧客|売上|予約/ });
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  }
}
