import { test, expect } from "@playwright/test";

test.describe("@cross 横断テスト: 認証ガード", () => {
  test("X-01: 未認証で /dashboard → /login リダイレクト", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await context.close();
  });

  test("X-02: 未認証で /customers → /login リダイレクト", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto("/customers");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await context.close();
  });

  test("X-03: 未認証で /records/new → /login リダイレクト", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto("/records/new");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await context.close();
  });
});

test.describe("@cross 横断テスト: パンくず・ナビゲーション", () => {
  test("X-04: 全主要ページに PageHeader が存在", async ({ page }) => {
    const pages = [
      "/customers",
      "/records",
      "/appointments",
      "/sales",
      "/settings",
    ];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      // 各ページに見出し（h1 or h2）が存在する
      const heading = page.locator("h1, h2").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
    }
  });
});

test.describe("@cross 横断テスト: レスポンシブ", () => {
  test("X-05: 320px幅で顧客一覧 — 崩れなし", async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 320, height: 568 },
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/顧客/);

    // 水平スクロールバーが出ていないことを確認
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await context.close();
  });

  test("X-06: 320px幅でカルテ一覧 — 崩れなし", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 320, height: 568 },
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto("/records");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/カルテ/);

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await context.close();
  });

  test("X-07: 320px幅で予約カレンダー — 崩れなし", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 320, height: 568 },
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto("/appointments");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/予約/);

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await context.close();
  });

  test("X-08: 375px幅でダッシュボード — 崩れなし", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 375, height: 667 },
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await context.close();
  });
});

test.describe("@cross 横断テスト: UI表記統一", () => {
  test("X-09: フォーム送信ボタン表記 — 「保存する」", async ({ page }) => {
    // 顧客新規作成
    await page.goto("/customers/new");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("button[type='submit']").filter({ hasText: /保存する/ })
    ).toBeVisible();
  });

  test("X-10: 一覧ヘッダーボタン表記 — 「+ ○○を登録」", async ({
    page,
  }) => {
    // 顧客一覧
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("a, button").filter({ hasText: /\+ .*を登録/ }).first()
    ).toBeVisible();
  });

  test("X-11: 削除確認パネルの色 — bg-red系", async ({ page }) => {
    await page.goto("/customers/new");
    await page.waitForLoadState("networkidle");

    // 顧客を作成
    await page.getByPlaceholder("山田").fill("削除テスト");
    await page.getByPlaceholder("花子").fill("太郎");
    await page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ })
      .click();
    await page.waitForURL(/\/customers\/[^/]+$/, { timeout: 10_000 });

    // 編集ページに遷移
    await page.locator("a").filter({ hasText: /編集/ }).first().click();
    await page.waitForURL(/\/edit$/);
    await page.waitForLoadState("networkidle");

    // 下にスクロール
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // 削除セクションを開く
    await page
      .locator("button")
      .filter({ hasText: /この顧客を削除/ })
      .click();
    await page.waitForTimeout(300);

    // 赤い確認パネルが表示
    const deletePanel = page.locator(".bg-red-50, [class*='bg-red']").first();
    await expect(deletePanel).toBeVisible();

    // クリーンアップ: 削除実行
    await page.locator("button").filter({ hasText: /^削除する$/ }).click();
    await page.waitForURL(/\/customers$/, { timeout: 10_000 });
  });
});
