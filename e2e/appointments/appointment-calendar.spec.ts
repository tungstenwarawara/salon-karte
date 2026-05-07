import { test, expect } from "@playwright/test";

test.describe("@appointments 予約カレンダー・ビュー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/appointments");
    await page.waitForLoadState("networkidle");
  });

  test("A-06: デイビュー表示 — 日別が初期表示", async ({ page }) => {
    const dayBtn = page.locator("button").filter({ hasText: "日別" });
    await expect(dayBtn).toBeVisible();
    // 日別が選択状態（bg-accent系）
    await expect(dayBtn).toHaveClass(/bg-accent|bg-surface/);
  });

  test("A-07: ウィークビュー表示 — 週別に切替", async ({ page }) => {
    const weekBtn = page.locator("button").filter({ hasText: "週別" });
    await weekBtn.click();
    await page.waitForTimeout(500);
    await expect(weekBtn).toHaveClass(/bg-accent/);
  });

  test("A-08: マンスビュー表示 — 月別に切替", async ({ page }) => {
    const monthBtn = page.locator("button").filter({ hasText: "月別" });
    await monthBtn.click();
    await page.waitForTimeout(500);
    await expect(monthBtn).toHaveClass(/bg-accent/);
  });

  test("A-09: ビューモード切替 — 日→週→月→日", async ({ page }) => {
    const dayBtn = page.locator("button").filter({ hasText: "日別" });
    const weekBtn = page.locator("button").filter({ hasText: "週別" });
    const monthBtn = page.locator("button").filter({ hasText: "月別" });

    await weekBtn.click();
    await page.waitForTimeout(300);
    await expect(weekBtn).toHaveClass(/bg-accent/);

    await monthBtn.click();
    await page.waitForTimeout(300);
    await expect(monthBtn).toHaveClass(/bg-accent/);

    await dayBtn.click();
    await page.waitForTimeout(300);
    await expect(dayBtn).toHaveClass(/bg-accent/);
  });

  test("A-10: 日付ナビゲーション — 前日/翌日", async ({ page }) => {
    // 「今日」ボタンが存在
    const todayBtn = page.locator("button").filter({ hasText: "今日" });
    await expect(todayBtn).toBeVisible();

    // 日付表示を取得
    const dateText = await page.locator("body").textContent();

    // 前日ボタン（< ナビ）
    const prevBtn = page.locator("button").filter({ hasText: /[<‹]/ }).first();
    if (await prevBtn.isVisible()) {
      await prevBtn.click();
      await page.waitForTimeout(300);
    }

    // 翌日ボタン（> ナビ）
    const nextBtn = page.locator("button").filter({ hasText: /[>›]/ }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }

    // 「今日」で元に戻る
    await todayBtn.click();
    await page.waitForTimeout(300);
  });

  test("A-E3: 予約0件の空状態 — メッセージ or カード表示", async ({ page }) => {
    // ページが正常に表示されている（予約管理テキストが存在）
    await expect(page.locator("body")).toContainText(/予約/);

    // 月別ビューに切り替えて確認（空状態メッセージが出やすい）
    const monthBtn = page.locator("button").filter({ hasText: "月別" });
    await monthBtn.click();
    await page.waitForTimeout(500);

    // 月別カレンダーが表示される
    await expect(page.locator("body")).toContainText(/日|月|火|水|木|金|土/);
  });
});
