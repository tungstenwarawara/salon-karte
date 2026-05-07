import { type Page, type Locator, expect } from "@playwright/test";
import { waitForToast, uniqueName } from "../test-helpers";

export class CustomersPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly newCustomerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/検索|名前/);
    this.newCustomerButton = page.locator("a, button").filter({ hasText: /顧客を登録/ });
  }

  async goto() {
    await this.page.goto("/customers");
    await this.page.waitForLoadState("networkidle");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // 検索はデバウンス or リアルタイムなので少し待つ
    await this.page.waitForTimeout(500);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  /** 顧客カード（一覧のアイテム）を取得 */
  getCustomerCards() {
    return this.page.locator("a[href*='/customers/']").filter({ hasText: /.+/ });
  }

  /** 来店間隔フィルター（ピルボタン） */
  async filterByInterval(days: number) {
    const pill = this.page.locator("button").filter({ hasText: `${days}日+` });
    await pill.click();
    await this.page.waitForTimeout(500);
  }

  /** 卒業済み除外トグル */
  async toggleGraduatedFilter() {
    const checkbox = this.page.locator("input[type='checkbox']").first();
    await checkbox.click();
    await this.page.waitForTimeout(500);
  }

  /** 顧客新規登録ページへ遷移 */
  async gotoNew() {
    await this.newCustomerButton.click();
    await this.page.waitForURL(/\/customers\/new/);
  }

  /** 最小項目で顧客登録（姓・名のみ） */
  async createMinimal(lastName: string, firstName: string) {
    await this.page.goto("/customers/new");
    await this.page.locator("input[name='last_name'], #last_name").fill(lastName);
    await this.page.locator("input[name='first_name'], #first_name").fill(firstName);
    await this.page.locator("button[type='submit']").filter({ hasText: /保存/ }).click();
  }

  /** 名前で特定の顧客詳細に遷移 */
  async gotoCustomerByName(name: string) {
    const card = this.getCustomerCards().filter({ hasText: name }).first();
    await card.click();
    await this.page.waitForURL(/\/customers\/[^/]+$/);
  }
}
