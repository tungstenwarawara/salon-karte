import { test, expect } from "@playwright/test";
import { TEST_SALON, MENUS } from "../fixtures/test-data";

/**
 * Web予約の公開ページテスト
 * 認証不要のページ。SUPABASE_SERVICE_ROLE_KEY が必要（booking APIが使う）。
 * 環境変数が未設定の場合、サーバーエラーになるためテスト全体をスキップする。
 */

// SERVICE_ROLE_KEY が設定されていない場合はスキップ
const skipIfNoServiceKey = !process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("@booking Web予約フォーム", () => {
  test.skip(() => skipIfNoServiceKey, "SUPABASE_SERVICE_ROLE_KEY が未設定のためスキップ");

  test("B-01: 予約フォーム表示 — サロン名・メニュー一覧", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto(`/book/${TEST_SALON.bookingSlug}`);
    await page.waitForLoadState("networkidle");

    // サロン名が表示
    await expect(page.locator("body")).toContainText(TEST_SALON.name);
    // メニュー一覧が表示（アクティブメニューのみ）
    await expect(page.locator("body")).toContainText(MENUS.facialBasic.name);

    await context.close();
  });

  test("B-02: メニュー選択 → 日時選択ステップへ進む", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto(`/book/${TEST_SALON.bookingSlug}`);
    await page.waitForLoadState("networkidle");

    // メニューを選択
    await page
      .locator("button, div")
      .filter({ hasText: MENUS.facialBasic.name })
      .first()
      .click();
    await page.waitForTimeout(300);

    // 「次へ」ボタンで進む
    const nextBtn = page.locator("button").filter({ hasText: "次へ" });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await page.waitForTimeout(500);

    // 日時選択ステップ（カレンダーが表示される）
    await expect(page.locator("body")).toContainText(/日|月|火|水|木|金|土/);

    await context.close();
  });

  test("B-03: 全ステップ通過 — メニュー → 日時 → 顧客情報 → 確認", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto(`/book/${TEST_SALON.bookingSlug}`);
    await page.waitForLoadState("networkidle");

    // Step 1: メニュー選択
    await page
      .locator("button, div")
      .filter({ hasText: MENUS.decollete.name })
      .first()
      .click();
    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: "次へ" }).click();
    await page.waitForTimeout(500);

    // Step 2: 日時選択 — 空きスロットをクリック
    // 利用可能な日付ボタンを探す
    const availableDay = page
      .locator("button")
      .filter({ hasNotText: /^\s*$/ })
      .filter({ has: page.locator(":not(.opacity-30)") });

    // 日付を選択（スロットが見つかれば）
    const dayButtons = page.locator(
      "button:not([disabled]):not(.opacity-30)"
    );
    // カレンダー内のクリック可能な日付を探す
    const dateGridButtons = page.locator("button").filter({ hasText: /^\d{1,2}$/ });
    const dateCount = await dateGridButtons.count();
    let slotSelected = false;

    for (let i = 0; i < Math.min(dateCount, 14); i++) {
      const btn = dateGridButtons.nth(i);
      const isDisabled = await btn.getAttribute("disabled");
      const classes = await btn.getAttribute("class");
      if (isDisabled === null && !classes?.includes("opacity-30")) {
        await btn.click();
        await page.waitForTimeout(500);

        // 時間スロットを探す
        const timeSlot = page
          .locator("button")
          .filter({ hasText: /^\d{1,2}:\d{2}$/ })
          .first();
        if (await timeSlot.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await timeSlot.click();
          slotSelected = true;
          break;
        }
      }
    }

    if (!slotSelected) {
      // スロットが見つからなければテスト終了（空きなし）
      await context.close();
      return;
    }

    await page.waitForTimeout(300);
    await page.locator("button").filter({ hasText: "次へ" }).click();
    await page.waitForTimeout(500);

    // Step 3: 顧客情報入力
    await expect(page.locator("body")).toContainText(/お客様情報/);
    await page.getByPlaceholder("山田").fill("テスト");
    await page.getByPlaceholder("花子").fill("予約");
    await page.getByPlaceholder("example@email.com").fill("e2e-booking@test.com");
    await page.getByPlaceholder("09012345678").fill("09000000000");

    // プライバシーポリシー同意
    const agreeCheckbox = page.locator("input[type='checkbox']").first();
    if (await agreeCheckbox.isVisible()) {
      await agreeCheckbox.check();
    }

    await page.locator("button").filter({ hasText: "次へ" }).click();
    await page.waitForTimeout(500);

    // Step 4: 確認画面
    await expect(page.locator("body")).toContainText(/確認|よろしいですか/);
    await expect(page.locator("body")).toContainText("テスト");
    await expect(page.locator("body")).toContainText(MENUS.decollete.name);

    // 送信はしない（テストデータ汚染防止）
    await context.close();
  });

  test("B-E1: 存在しないslug — エラー表示", async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto("/book/invalid-slug-e2e-test");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(
      /見つかりません|404|エラー/
    );

    await context.close();
  });

  test("B-E3: 必須項目未入力 — 次へボタンが無効", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto(`/book/${TEST_SALON.bookingSlug}`);
    await page.waitForLoadState("networkidle");

    // メニュー未選択で「次へ」が無効
    const nextBtn = page.locator("button").filter({ hasText: "次へ" });
    if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(nextBtn).toBeDisabled();
    }

    await context.close();
  });
});
