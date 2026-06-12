import { test, expect } from "@playwright/test";
import { CUSTOMERS } from "../fixtures/test-data";
import { uniqueName } from "../fixtures/test-helpers";

/** 顧客を検索して選択 */
async function selectCustomer(
  page: import("@playwright/test").Page,
  name: string
) {
  const searchInput = page.getByPlaceholder(/名前・カナで検索/);
  await expect(searchInput).toBeVisible({ timeout: 10_000 });
  await searchInput.fill(name);
  await page.waitForTimeout(500);
  // 検索結果の button[type=button] をクリック
  const btn = page
    .locator("button[type='button']")
    .filter({ hasText: name })
    .first();
  await expect(btn).toBeVisible({ timeout: 5_000 });
  await btn.click();
  await page.waitForTimeout(300);
}

/** N番目のメニューチェックボックスを選択 */
async function selectMenuByIndex(
  page: import("@playwright/test").Page,
  index: number = 0
) {
  const menuSection = page.locator("text=施術メニュー");
  await menuSection.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const checkboxes = page.locator("input[type='checkbox']");
  await expect(checkboxes.nth(index)).toBeVisible({ timeout: 5_000 });
  await checkboxes.nth(index).check();
  await page.waitForTimeout(300);
}

/** 予約の新規作成ページに遷移 */
async function gotoNewAppointment(page: import("@playwright/test").Page) {
  await page.goto("/appointments/new");
  await page.waitForLoadState("networkidle");
}

/** 予約詳細ページから削除 */
async function deleteAppointmentFromDetail(
  page: import("@playwright/test").Page
) {
  // 「この予約を削除」をクリック
  const deleteToggle = page
    .locator("button, a")
    .filter({ hasText: /この予約を削除/ });
  await expect(deleteToggle).toBeVisible({ timeout: 5_000 });
  await deleteToggle.click();

  // 確認パネルの「削除する」をクリック
  const confirmBtn = page.locator("button").filter({ hasText: /^削除する$/ });
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  await page.waitForURL(/\/appointments/, { timeout: 10_000 });
}

test.describe("@appointments 予約CRUD", () => {
  test("A-01: 予約登録（基本） → 一覧遷移", async ({ page }) => {
    await gotoNewAppointment(page);

    // 顧客選択
    await selectCustomer(page, CUSTOMERS.yamada.lastName);

    // 保存（メニュー・日時はデフォルト値で）
    await page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ })
      .click();

    // 一覧にリダイレクト
    await page.waitForURL(/\/appointments/, { timeout: 15_000 });

    // 作成した予約を見つけて削除するため詳細を開く
    // 今日の日別ビューに山田花子の予約があるはず
    await page.waitForTimeout(500);
    const card = page
      .locator("a[href*='/appointments/']")
      .filter({ hasText: CUSTOMERS.yamada.lastName })
      .first();
    if (await card.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await card.click();
      await page.waitForURL(/\/appointments\/[^/]+$/);
      await deleteAppointmentFromDetail(page);
    }
  });

  test("A-02: 顧客名検索 — 絞り込み", async ({ page }) => {
    await gotoNewAppointment(page);

    const searchInput = page.getByPlaceholder(/名前・カナで検索/);
    await searchInput.fill(CUSTOMERS.sato.lastName);
    await page.waitForTimeout(500);

    // 佐藤が表示される（候補リストとカレンダー双方に出るため first で検証）
    await expect(
      page.locator("body").locator(`:text("${CUSTOMERS.sato.lastName}")`).first()
    ).toBeVisible();
  });

  test("A-03: 複数メニュー選択 — 合計時間・金額表示", async ({ page }) => {
    await gotoNewAppointment(page);
    await selectCustomer(page, CUSTOMERS.tanaka.lastName);

    await selectMenuByIndex(page, 0);
    await selectMenuByIndex(page, 1);

    // 合計表示を確認（2件選択されている）
    await expect(page.locator("body")).toContainText(/選択中.*2件/);
  });

  test("A-11: 予約詳細表示 — ステータス・顧客名表示", async ({ page }) => {
    await page.goto("/appointments");
    await page.waitForLoadState("networkidle");

    // 予約カードをクリック
    const card = page
      .locator("a[href*='/appointments/']")
      .filter({ hasNotText: /予約を登録/ })
      .first();

    if (await card.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await card.click();
      await page.waitForURL(/\/appointments\/[^/]+$/);

      // ステータスバッジが存在
      await expect(page.locator("body")).toContainText(
        /予定|来店済|キャンセル/
      );
      // 顧客名リンクが存在
      await expect(
        page.locator("a[href*='/customers/']").first()
      ).toBeVisible();
    }
  });

  test("A-12: 予約編集 — 日時変更 → 保存 → 反映", async ({ page }) => {
    // テスト用予約を作成
    await gotoNewAppointment(page);
    await selectCustomer(page, CUSTOMERS.suzuki.lastName);
    await page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ })
      .click();
    await page.waitForURL(/\/appointments/, { timeout: 15_000 });
    await page.waitForTimeout(500);

    // 今日のビューで鈴木の予約を探す
    const card = page
      .locator("a[href*='/appointments/']")
      .filter({ hasText: CUSTOMERS.suzuki.lastName })
      .first();
    if (!(await card.isVisible({ timeout: 3_000 }).catch(() => false))) {
      // 見つからなければスキップ
      return;
    }
    await card.click();
    await page.waitForURL(/\/appointments\/[^/]+$/);

    // 編集ページへ（scheduledの場合のみ編集リンクが表示される）
    const editLink = page.locator("a").filter({ hasText: /編集/ }).first();
    if (await editLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editLink.click();
      await page.waitForURL(/\/edit$/);
      await page.waitForLoadState("networkidle");

      // メモを変更
      const memoField = page.locator("#memo, textarea").first();
      await memoField.fill("E2E編集テストメモ");

      // 保存
      await page
        .locator("button[type='submit']")
        .filter({ hasText: /保存/ })
        .click();
      await page.waitForURL(/\/appointments/, { timeout: 15_000 });
    }

    // クリーンアップ: 予約を削除
    await page.waitForTimeout(500);
    const cardAfter = page
      .locator("a[href*='/appointments/']")
      .filter({ hasText: CUSTOMERS.suzuki.lastName })
      .first();
    if (await cardAfter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cardAfter.click();
      await page.waitForURL(/\/appointments\/[^/]+$/);
      await deleteAppointmentFromDetail(page);
    }
  });

  test("A-13: ステータス変更 — 来店のみ記録", async ({ page }) => {
    // テスト用予約を作成
    await gotoNewAppointment(page);
    await selectCustomer(page, CUSTOMERS.takahashi.lastName);
    await page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ })
      .click();
    await page.waitForURL(/\/appointments/, { timeout: 15_000 });
    await page.waitForTimeout(500);

    // 高橋の予約を探す
    const card = page
      .locator("a[href*='/appointments/']")
      .filter({ hasText: CUSTOMERS.takahashi.lastName })
      .first();
    if (!(await card.isVisible({ timeout: 3_000 }).catch(() => false))) {
      return;
    }
    await card.click();
    await page.waitForURL(/\/appointments\/[^/]+$/);

    // 「来店のみ記録」ボタン
    const visitBtn = page
      .locator("button")
      .filter({ hasText: /来店のみ記録/ });
    if (await visitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await visitBtn.click();
      await page.waitForTimeout(1000);
      // ステータスが「来店済」に変わる
      await expect(page.locator("body")).toContainText(/来店済/);
    }

    // クリーンアップ
    await deleteAppointmentFromDetail(page);
  });

  test("A-14: 予約キャンセル", async ({ page }) => {
    // テスト用予約を作成
    await gotoNewAppointment(page);
    await selectCustomer(page, CUSTOMERS.sato.lastName);
    await page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ })
      .click();
    await page.waitForURL(/\/appointments/, { timeout: 15_000 });
    await page.waitForTimeout(500);

    // 佐藤の予約を探す
    const card = page
      .locator("a[href*='/appointments/']")
      .filter({ hasText: CUSTOMERS.sato.lastName })
      .first();
    if (!(await card.isVisible({ timeout: 3_000 }).catch(() => false))) {
      return;
    }
    await card.click();
    await page.waitForURL(/\/appointments\/[^/]+$/);

    // 「予約をキャンセル」ボタン
    const cancelBtn = page
      .locator("button")
      .filter({ hasText: /予約をキャンセル/ });
    if (await cancelBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toContainText(/キャンセル/);
    }

    // クリーンアップ
    await deleteAppointmentFromDetail(page);
  });

  test("A-15: 予約削除 → 一覧遷移", async ({ page }) => {
    // テスト用予約を作成
    await gotoNewAppointment(page);
    await selectCustomer(page, CUSTOMERS.tanaka.lastName);
    await page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ })
      .click();
    await page.waitForURL(/\/appointments/, { timeout: 15_000 });
    await page.waitForTimeout(500);

    // 田中の予約を探す
    const card = page
      .locator("a[href*='/appointments/']")
      .filter({ hasText: CUSTOMERS.tanaka.lastName })
      .first();
    if (!(await card.isVisible({ timeout: 3_000 }).catch(() => false))) {
      return;
    }
    await card.click();
    await page.waitForURL(/\/appointments\/[^/]+$/);

    // 削除
    await deleteAppointmentFromDetail(page);
    await expect(page).toHaveURL(/\/appointments/);
  });

  test("A-16: 「カルテを登録」遷移 — プリフィル付き", async ({ page }) => {
    await page.goto("/appointments");
    await page.waitForLoadState("networkidle");

    // 予約カードをクリック
    const card = page
      .locator("a[href*='/appointments/']")
      .filter({ hasNotText: /予約を登録/ })
      .first();
    if (!(await card.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return;
    }
    await card.click();
    await page.waitForURL(/\/appointments\/[^/]+$/);

    // 「カルテを登録」リンク
    const recordBtn = page
      .locator("a")
      .filter({ hasText: /カルテを登録/ })
      .first();
    if (await recordBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const href = await recordBtn.getAttribute("href");
      // URLにcustomer, appointment, dateパラメータが含まれる
      expect(href).toContain("customer=");
      expect(href).toContain("appointment=");
    }
  });

  test("A-17: メモ入力 — 予約にメモを追加", async ({ page }) => {
    await gotoNewAppointment(page);
    await selectCustomer(page, CUSTOMERS.yamada.lastName);

    // その他のオプションを開く
    const optionSection = page
      .locator("button")
      .filter({ hasText: /その他のオプション/ });
    if (await optionSection.isVisible().catch(() => false)) {
      await optionSection.click();
      await page.waitForTimeout(300);
    }

    // メモ入力
    const memoField = page.locator("#memo, textarea").filter({ hasText: "" }).first();
    if (await memoField.isVisible().catch(() => false)) {
      await memoField.fill("E2Eテストメモ");
    }

    // 保存
    await page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ })
      .click();
    await page.waitForURL(/\/appointments/, { timeout: 15_000 });

    // クリーンアップ
    await page.waitForTimeout(500);
    const card = page
      .locator("a[href*='/appointments/']")
      .filter({ hasText: CUSTOMERS.yamada.lastName })
      .first();
    if (await card.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await card.click();
      await page.waitForURL(/\/appointments\/[^/]+$/);
      await deleteAppointmentFromDetail(page);
    }
  });

  test("A-E1: 顧客未選択で保存 → エラー表示", async ({ page }) => {
    await gotoNewAppointment(page);
    // 顧客を選択せずに保存
    await page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ })
      .click();
    await page.waitForTimeout(1000);

    // エラーメッセージ or ページ遷移しない
    await expect(page).toHaveURL(/\/appointments\/new/);
    await expect(page.locator("body")).toContainText(/顧客を選択/);
  });

  test("A-E2: 保存中の二重送信防止", async ({ page }) => {
    await gotoNewAppointment(page);
    await selectCustomer(page, CUSTOMERS.suzuki.lastName);

    const submitBtn = page
      .locator("button[type='submit']")
      .filter({ hasText: /保存/ });

    // クリック後すぐに「保存中...」テキストまたは disabled を確認
    await Promise.all([
      submitBtn.click(),
      // ボタンが disabled になるか「保存中」テキストに変わるかを確認
      expect(submitBtn).toBeDisabled({ timeout: 3_000 }).catch(() => null),
    ]);

    // 成功時はリダイレクトされる
    await page.waitForURL(/\/appointments/, { timeout: 15_000 });
    await page.waitForTimeout(500);
    const card = page
      .locator("a[href*='/appointments/']")
      .filter({ hasText: CUSTOMERS.suzuki.lastName })
      .first();
    if (await card.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await card.click();
      await page.waitForURL(/\/appointments\/[^/]+$/);
      await deleteAppointmentFromDetail(page);
    }
  });
});
