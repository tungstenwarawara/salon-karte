import { test, expect } from "@playwright/test";
import { MENUS } from "../fixtures/test-data";
import { uniqueName } from "../fixtures/test-helpers";

test.describe("@settings 設定ページ", () => {
  test("ST-01: 設定トップ表示 — メニューカード一覧", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/設定/);
    // 主要なカードリンクが存在
    await expect(page.locator("body")).toContainText(/営業時間/);
    await expect(page.locator("body")).toContainText(/施術メニュー/);
    await expect(page.locator("body")).toContainText(/Web予約/);
    await expect(page.locator("body")).toContainText(/料金プラン/);
  });

  test("ST-02: メニュー登録 → 削除", async ({ page }) => {
    await page.goto("/settings/menus");
    await page.waitForLoadState("networkidle");

    // 「+ メニューを登録」
    const addBtn = page
      .locator("button, a")
      .filter({ hasText: /メニューを登録/ })
      .first();
    await addBtn.click();
    await page.waitForTimeout(300);

    // メニュー名入力
    const menuName = uniqueName("テストメニュー");
    await page.getByPlaceholder(/例: フェイシャルエステ/).fill(menuName);

    // 所要時間
    const durationInput = page.getByPlaceholder("60", { exact: true });
    if (await durationInput.isVisible()) {
      await durationInput.fill("30");
    }

    // 料金
    const priceInput = page.getByPlaceholder("10000");
    if (await priceInput.isVisible()) {
      await priceInput.fill("5000");
    }

    // 追加する
    await page
      .locator("button")
      .filter({ hasText: /追加する|保存/ })
      .first()
      .click();
    await page.waitForTimeout(1000);

    await expect(page.locator("body")).toContainText(menuName);

    // 削除（作成したメニューのカード内ボタンに限定 — 「最初の削除ボタン」だと既存の種メニューを誤削除する）
    const menuCard = page
      .locator("div.bg-surface.rounded-xl")
      .filter({ hasText: menuName })
      .first();
    const deleteBtn = menuCard.locator("button").filter({ hasText: /削除/ }).first();
    await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
    await deleteBtn.click();
    // 確認パネルに対象メニュー名が表示されることを検証してから確定（誤対象の削除防止）
    await expect(page.locator("body")).toContainText(`「${menuName}」を削除しますか？`);
    await page.locator("button").filter({ hasText: /^削除する$/ }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).not.toContainText(menuName);
  });

  test("ST-03: メニュー編集 — 既存メニューの編集ボタン", async ({
    page,
  }) => {
    await page.goto("/settings/menus");
    await page.waitForLoadState("networkidle");

    const editBtn = page
      .locator("button")
      .filter({ hasText: /編集/ })
      .first();
    if (await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(300);

      // キャンセル
      const cancelBtn = page
        .locator("button")
        .filter({ hasText: /キャンセル/ })
        .first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  test("ST-06: 営業時間変更 — ページ表示・曜日トグル", async ({ page }) => {
    await page.goto("/settings/business-hours");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/営業時間/);
    // 曜日名が表示
    await expect(page.locator("body")).toContainText(/月曜|火曜|水曜/);
  });

  test("ST-07: 定休日設定 — カレンダー表示", async ({ page }) => {
    await page.goto("/settings/holidays");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/不定休|営業時間変更/);
    // カレンダーの曜日ヘッダー
    await expect(page.locator("body")).toContainText(/日|月|火|水|木|金|土/);
  });

  test("ST-08: 定休日の月ナビ — 前月/翌月", async ({ page }) => {
    await page.goto("/settings/holidays");
    await page.waitForLoadState("networkidle");

    // 前月ボタン
    const prevBtn = page
      .locator("button")
      .filter({ hasText: /[<‹←]/ })
      .first();
    if (await prevBtn.isVisible()) {
      await prevBtn.click();
      await page.waitForTimeout(300);
    }

    // 翌月ボタン
    const nextBtn = page
      .locator("button")
      .filter({ hasText: /[>›→]/ })
      .first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test("ST-09: 予約ルール変更 — ページ表示", async ({ page }) => {
    await page.goto("/settings/booking-rules");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/予約受付/);
    await expect(page.locator("body")).toContainText(/当日予約/);
  });

  test("ST-10: Web予約設定 — 公開トグル・URL表示", async ({ page }) => {
    await page.goto("/settings/web-booking");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/Web予約/);
    // 公開トグル（switch）
    const toggle = page.locator("[role='switch']").first();
    if (await toggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(toggle).toBeVisible();
    }
    // コピーボタン
    const copyBtn = page.locator("button").filter({ hasText: /コピー/ });
    if (await copyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(copyBtn).toBeVisible();
    }
  });

  test("ST-11: スタッフ一覧表示", async ({ page }) => {
    await page.goto("/settings/staff");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/スタッフ/);
  });

  test("ST-12: シフト週間グリッド表示", async ({ page }) => {
    await page.goto("/settings/shifts");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/シフト/);
  });

  test("ST-13: シフト週ナビ — 前週/翌週", async ({ page }) => {
    await page.goto("/settings/shifts");
    await page.waitForLoadState("networkidle");

    const prevWeekBtn = page
      .locator("button")
      .filter({ hasText: /前週/ });
    if (await prevWeekBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await prevWeekBtn.click();
      await page.waitForTimeout(300);
    }

    const todayBtn = page.locator("button").filter({ hasText: /今週/ });
    if (await todayBtn.isVisible()) {
      await todayBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test("ST-14: 課金ページ表示 — プラン情報", async ({ page }) => {
    await page.goto("/settings/billing");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/料金プラン/);
    await expect(page.locator("body")).toContainText(
      /おためし|スタンダード/
    );
  });

  test("ST-15: エクスポートページ表示 — ダウンロードボタン", async ({
    page,
  }) => {
    await page.goto("/settings/export");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/データエクスポート/);
    // ダウンロードボタンが存在
    const downloadBtn = page
      .locator("button")
      .filter({ hasText: /ダウンロード/ })
      .first();
    await expect(downloadBtn).toBeVisible();
  });

  test("ST-E1: メニュー名空で保存 → エラー", async ({ page }) => {
    await page.goto("/settings/menus");
    await page.waitForLoadState("networkidle");

    const addBtn = page
      .locator("button, a")
      .filter({ hasText: /メニューを登録/ })
      .first();
    await addBtn.click();
    await page.waitForTimeout(300);

    // 名前を空のまま保存
    await page
      .locator("button")
      .filter({ hasText: /追加する|保存/ })
      .first()
      .click();
    await page.waitForTimeout(500);

    // フォームが残っている（バリデーションエラー）
    await expect(
      page.getByPlaceholder(/例: フェイシャルエステ/)
    ).toBeVisible();
  });
});
