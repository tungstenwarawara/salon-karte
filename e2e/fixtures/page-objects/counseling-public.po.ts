import { type Page, type Locator, expect } from "@playwright/test";

export class CounselingPublicPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** カウンセリング回答フォームにアクセス */
  async goto(id: string) {
    await this.page.goto(`/c/${id}`);
    await this.page.waitForLoadState("networkidle");
  }

  /** フォームが表示されることを確認 */
  async expectForm() {
    await expect(this.page.locator("form, [data-testid='counseling-form']").first()).toBeVisible({ timeout: 10_000 });
  }

  /** テキストフィールドに入力 */
  async fillTextField(label: string, value: string) {
    const field = this.page.locator(`input, textarea`).filter({ has: this.page.locator(`text="${label}"`) });
    // label直後のinput/textareaを探す
    const labelEl = this.page.locator("label").filter({ hasText: label }).first();
    const input = labelEl.locator("~ input, ~ textarea, + input, + textarea").first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill(value);
    } else {
      // fallback: 同一セクション内のinput
      const section = labelEl.locator("..").first();
      const fallbackInput = section.locator("input, textarea").first();
      await fallbackInput.fill(value);
    }
  }

  /** 送信 */
  async submit() {
    const btn = this.page.locator("button[type='submit']").filter({ hasText: /送信|回答/ }).first();
    await btn.click();
  }
}
