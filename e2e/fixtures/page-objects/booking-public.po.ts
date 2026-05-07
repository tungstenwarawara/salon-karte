import { type Page, type Locator, expect } from "@playwright/test";
import { TEST_SALON } from "../test-data";

export class BookingPublicPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Web予約フォームにアクセス */
  async goto(slug?: string) {
    await this.page.goto(`/book/${slug ?? TEST_SALON.bookingSlug}`);
    await this.page.waitForLoadState("networkidle");
  }

  /** サロン名が表示されることを確認 */
  async expectSalonName(name?: string) {
    await expect(this.page.locator("body")).toContainText(name ?? TEST_SALON.name, { timeout: 10_000 });
  }

  /** メニューを選択 */
  async selectMenu(menuName: string) {
    const menu = this.page.locator("button, label, div[role='option']").filter({ hasText: menuName }).first();
    await menu.click();
  }

  /** キャンセルページにアクセス */
  async gotoCancelPage(token: string) {
    await this.page.goto(`/book/cancel/${token}`);
    await this.page.waitForLoadState("networkidle");
  }

  /** 変更ページにアクセス */
  async gotoChangePage(token: string) {
    await this.page.goto(`/book/change/${token}`);
    await this.page.waitForLoadState("networkidle");
  }
}
