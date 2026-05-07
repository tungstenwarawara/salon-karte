import { type Page, type Locator, expect } from "@playwright/test";

export class SalesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/sales");
    await this.page.waitForLoadState("networkidle");
  }

  /** 売上サマリーが表示されることを確認 */
  async expectSummary() {
    await expect(this.page.locator("body")).toContainText(/売上|サマリー|月/, { timeout: 10_000 });
  }

  /** 在庫ページへ */
  async gotoInventory() {
    await this.page.goto("/sales/inventory");
    await this.page.waitForLoadState("networkidle");
  }
}
