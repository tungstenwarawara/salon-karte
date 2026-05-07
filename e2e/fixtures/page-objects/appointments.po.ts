import { type Page, type Locator, expect } from "@playwright/test";

export class AppointmentsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/appointments");
    await this.page.waitForLoadState("networkidle");
  }

  /** ビューモード切替（日/週/月） */
  async switchView(mode: "日" | "週" | "月") {
    const btn = this.page.locator("button").filter({ hasText: mode }).first();
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  /** 日付ナビゲーション */
  async navigateNext() {
    const next = this.page.locator("button[aria-label*='次'], button").filter({ hasText: /›|>|次/ }).first();
    await next.click();
    await this.page.waitForTimeout(500);
  }

  async navigatePrev() {
    const prev = this.page.locator("button[aria-label*='前'], button").filter({ hasText: /‹|<|前/ }).first();
    await prev.click();
    await this.page.waitForTimeout(500);
  }

  /** 予約登録ページへ */
  async gotoNew() {
    const btn = this.page.locator("a, button").filter({ hasText: /予約を登録/ }).first();
    await btn.click();
    await this.page.waitForURL(/\/appointments\/new/);
  }
}
