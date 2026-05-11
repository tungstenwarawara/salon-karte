import { test, expect } from "@playwright/test";

/**
 * 予約キャンセルダイアログの動作確認
 * - 「予約をキャンセル」ボタンでモーダルが開く
 * - キャンセル理由の入力欄
 * - キャンセル料トグル + 4つの支払方法選択肢
 * - 「もどる」で閉じる
 *
 * 注意: 実際に予約をキャンセルするテストはテストデータを破壊するため、
 * UI 表示の確認までに留める（モーダルを開いて「もどる」で閉じる）
 */

const SCHEDULED_APPOINTMENT_ID = "00000000-0000-0000-0000-000000006001";

test.describe("@appointments キャンセルダイアログ", () => {
  test("CD-01: 予約をキャンセルボタンでモーダル展開", async ({ page }) => {
    await page.goto(`/appointments/${SCHEDULED_APPOINTMENT_ID}`);
    await page.waitForLoadState("networkidle");

    const cancelBtn = page.locator("button").filter({ hasText: "予約をキャンセル" }).first();
    await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
    await cancelBtn.click();
    await page.waitForTimeout(500);

    // モーダルの見出し
    await expect(page.locator("h2").filter({ hasText: "予約をキャンセルしますか？" })).toBeVisible();

    // キャンセル理由欄
    await expect(page.locator("text=キャンセル理由（任意）")).toBeVisible();

    // キャンセル料トグル（チェックボックス）
    await expect(page.locator("text=キャンセル料を記録する")).toBeVisible();

    // 「もどる」ボタンで閉じる
    await page.locator("button").filter({ hasText: "もどる" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("h2").filter({ hasText: "予約をキャンセルしますか？" })).not.toBeVisible();
  });

  test("CD-02: キャンセル料トグルを開くと4つの支払方法が表示される", async ({ page }) => {
    await page.goto(`/appointments/${SCHEDULED_APPOINTMENT_ID}`);
    await page.waitForLoadState("networkidle");

    await page.locator("button").filter({ hasText: "予約をキャンセル" }).first().click();
    await page.waitForTimeout(500);

    // キャンセル料トグルをON
    const feeCheckbox = page.locator("input[type='checkbox']").first();
    await feeCheckbox.check();
    await page.waitForTimeout(300);

    // 4つの支払方法
    await expect(page.locator("text=無料にする")).toBeVisible();
    await expect(page.locator("text=現金でもらう")).toBeVisible();
    await expect(page.locator("text=カード・振込でもらう")).toBeVisible();
    await expect(page.locator("text=お持ちの回数券から1回引く")).toBeVisible();

    // カード選択 → 金額入力欄 + 「予約メニューの合計金額を初期値に入れています」表示
    await page.locator("label").filter({ hasText: "カード・振込でもらう" }).click();
    await page.waitForTimeout(300);
    await expect(page.locator("text=金額")).toBeVisible();

    // モーダルを閉じる
    await page.locator("button").filter({ hasText: "もどる" }).click();
    await page.waitForTimeout(500);
  });
});
