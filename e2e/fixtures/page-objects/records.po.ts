import { type Page, type Locator, expect } from "@playwright/test";

export class RecordsPage {
  readonly page: Page;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/検索|顧客名/);
  }

  async goto() {
    await this.page.goto("/records");
    await this.page.waitForLoadState("networkidle");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  /** カルテカード一覧 */
  getRecordCards() {
    return this.page.locator("a[href*='/records/']").filter({ hasText: /.+/ });
  }

  /** 期間フィルターを選択 */
  async filterByPeriod(label: string) {
    const buttons = this.page.locator("button").filter({ hasText: new RegExp(label) });
    await buttons.first().click();
    await this.page.waitForTimeout(500);
  }

  /** カルテ新規作成ページへ */
  async gotoNew() {
    await this.page.goto("/records/new");
    await this.page.waitForLoadState("networkidle");
  }

  /** カルテ新規作成: 顧客を選択 */
  async selectCustomer(name: string) {
    // 顧客検索→選択
    const customerSearch = this.page.getByPlaceholder(/顧客/);
    await customerSearch.fill(name);
    await this.page.waitForTimeout(500);
    const option = this.page.locator("button, div[role='option'], li").filter({ hasText: name }).first();
    await option.click();
  }

  /** カルテ新規作成: メニューを選択 */
  async selectMenu(menuName: string) {
    const menuCheckbox = this.page.locator("label, div").filter({ hasText: menuName }).first();
    await menuCheckbox.click();
  }

  /** 保存ボタンをクリック */
  async save() {
    const submit = this.page.locator("button[type='submit']").filter({ hasText: /保存/ });
    await submit.click();
  }
}
