import { type Page, type Locator, expect } from "@playwright/test";

export class SettingsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/settings");
    await this.page.waitForLoadState("networkidle");
  }

  /** 設定メニューカードが表示されることを確認 */
  async expectMenuCards() {
    const cards = this.page.locator("a[href*='/settings/']");
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  }

  /** 特定の設定ページへ遷移 */
  async gotoSection(path: string) {
    await this.page.goto(`/settings/${path}`);
    await this.page.waitForLoadState("networkidle");
  }
}
