/**
 * @activation セットアップウィザード（4ステップ）の E2E
 *
 * 営業活動で流入したユーザーが「サインアップ → メール確認後の最初の画面」で
 * 詰まると即離脱するため、最重要のフロー。
 *
 * 戦略:
 * - admin client でメール確認済みフレッシュユーザーを作成
 * - /login からプログラム的にログイン
 * - /setup の4ステップを実走
 * - /dashboard 到達 + 挨拶 + 登録メニューが反映されていることを確認
 * - cleanup でユーザー + サロンを削除
 */
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  ACTIVATION_PASSWORD,
  cleanupActivationUser,
  createConfirmedUser,
  generateActivationEmail,
} from "../fixtures/test-users";

/** admin client で「ユーザーのサロン」と「そのサロンのメニュー」を取得（DB 検証用） */
async function getOwnedSalonAndMenus(userId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: salon } = await admin
    .from("salons")
    .select("id, name")
    .eq("owner_id", userId)
    .single();
  if (!salon) return { salon: null, menus: [] };
  const { data: menus } = await admin
    .from("treatment_menus")
    .select("name, price, duration_minutes")
    .eq("salon_id", salon.id);
  return { salon, menus: menus ?? [] };
}

test.use({ storageState: { cookies: [], origins: [] } });

/** /login フォームから一般的な経路でログインする */
async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]:has-text("ログイン")');
  // 新規ユーザー（サロン未作成）は /setup にリダイレクト
  await page.waitForURL(/\/setup/, { timeout: 15_000 });
}

test.describe("@activation セットアップウィザード", () => {
  test("AS-SETUP-01: 全ステップ通過 → ダッシュボード到達", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2Eサロン_${Date.now()}`;
    const menuName = "テストカット";

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);

      // Step 1: サロン情報（業種選択を含む）
      await expect(page.locator("body")).toContainText("サロン情報を入力");
      await page.fill("#setup-name", salonName);
      await page.fill("#setup-phone", "03-1234-5678");
      await page.fill("#setup-address", "東京都渋谷区テスト1-2-3");
      await page.locator("button").filter({ hasText: /^エステ$/ }).click();
      await page.locator("button[type='submit']").filter({ hasText: /次へ/ }).click();

      // Step 2: 営業時間（デフォルト値のまま次へ）
      await expect(page.locator("body")).toContainText("営業時間の設定");
      await page.locator("button").filter({ hasText: /^次へ$/ }).click();

      // Step 3: メニュー
      await expect(page.locator("body")).toContainText("メニューを登録");
      await page.fill("#setup-menu-name", menuName);
      await page.fill("#setup-menu-duration", "60");
      await page.fill("#setup-menu-price", "5000");
      await page.locator("button[type='submit']").filter({ hasText: /完了/ }).click();

      // Step 4: 完了画面（サンプル投入は選ばずに進む）
      await expect(page.locator("body")).toContainText(`${salonName} の準備ができました`);
      await page.locator("button").filter({ hasText: /^サンプルなしで始める$/ }).click();

      // ダッシュボード到達 — 時間帯依存の挨拶 + サロン名 + KPIカード
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
      await expect(page.locator("body")).toContainText(
        /おはようございます|こんにちは|おつかれさまです/,
      );
      await expect(page.locator("body")).toContainText(salonName);
      await expect(page.locator("body")).toContainText("今日の予約");

      // 登録したメニューが DB 反映されていることを admin 経由で確認
      // (mobile では /settings/menus への遷移が dashboard 側のデータロードと競合するため、UI ナビゲーション非依存で検証)
      const { salon, menus } = await getOwnedSalonAndMenus(userId);
      expect(salon?.name).toBe(salonName);
      expect(menus.some((m) => m.name === menuName)).toBe(true);
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });

  test("AS-SETUP-02: 営業時間とメニューをスキップしても完了できる", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2Eスキップ_${Date.now()}`;

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);

      // Step 1（業種選択を含む）
      await page.fill("#setup-name", salonName);
      await page.locator("button").filter({ hasText: /^エステ$/ }).click();
      await page.locator("button[type='submit']").filter({ hasText: /次へ/ }).click();

      // Step 2: スキップ
      await expect(page.locator("body")).toContainText("営業時間の設定");
      await page.locator("button").filter({ hasText: /スキップ/ }).click();

      // Step 3: スキップ
      await expect(page.locator("body")).toContainText("メニューを登録");
      await page.locator("button").filter({ hasText: /スキップ/ }).click();

      // Step 4: 完了
      await expect(page.locator("body")).toContainText(`${salonName} の準備ができました`);
      await page.locator("button").filter({ hasText: /^サンプルなしで始める$/ }).click();

      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });

  test("AS-SETUP-03: サロン名・業種が未入力 → 次へボタンが無効", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);

      // Step 1: サロン名なし
      const nextBtn = page.locator("button[type='submit']").filter({ hasText: /次へ/ });
      await expect(nextBtn).toBeDisabled();

      // サロン名だけでは有効にならない（業種も必須）
      await page.fill("#setup-name", "テスト");
      await expect(nextBtn).toBeDisabled();

      // 業種を選ぶと有効になる
      await page.locator("button").filter({ hasText: /^エステ$/ }).click();
      await expect(nextBtn).toBeEnabled();
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });

  test("AS-SETUP-04: Step2の戻るボタンでStep1に戻れる + 入力が保持される", async ({ page }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2E戻り_${Date.now()}`;

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);

      // Step 1 入力（業種選択を含む）
      await page.fill("#setup-name", salonName);
      await page.fill("#setup-phone", "090-1111-2222");
      await page.locator("button").filter({ hasText: /^エステ$/ }).click();
      await page.locator("button[type='submit']").filter({ hasText: /次へ/ }).click();

      // Step 2 へ → 戻る
      await expect(page.locator("body")).toContainText("営業時間の設定");
      await page.locator("button").filter({ hasText: /^戻る$/ }).click();

      // Step 1 に戻る + 入力保持
      await expect(page.locator("body")).toContainText("サロン情報を入力");
      await expect(page.locator("#setup-name")).toHaveValue(salonName);
      await expect(page.locator("#setup-phone")).toHaveValue("090-1111-2222");
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });

  test("AS-SETUP-05: ダッシュボード到達後に再度 /setup にアクセス → /dashboard へリダイレクト", async ({
    page,
  }) => {
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2Eリダイレクト_${Date.now()}`;

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);

      // 最低限のセットアップを完了
      await page.fill("#setup-name", salonName);
      await page.locator("button").filter({ hasText: /^エステ$/ }).click();
      await page.locator("button[type='submit']").filter({ hasText: /次へ/ }).click();
      await page.locator("button").filter({ hasText: /スキップ/ }).click();
      await page.locator("button").filter({ hasText: /スキップ/ }).click();
      await page.locator("button").filter({ hasText: /^サンプルなしで始める$/ }).click();
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

      // 再度 /setup にアクセス → /dashboard に戻される
      await page.goto("/setup");
      await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });
});

test.describe("@activation セットアップ後のアクティベーション", () => {
  test("AS-FIRST-01: setup完了 → ダッシュボード到達 + サロン・メニュー DB 反映", async ({
    page,
  }) => {
    // ※ 顧客登録・カルテ登録 のフロー検証は customer-crud / record-create が責務。
    //   ここは「setup ウィザードが完走してアプリが使える状態になる」ことだけを検証する。
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    const salonName = `E2Eアクティベート_${Date.now()}`;
    const menuName = "ベーシックケア";

    try {
      await loginAs(page, email, ACTIVATION_PASSWORD);

      // セットアップ（メニュー登録あり）
      await page.fill("#setup-name", salonName);
      await page.locator("button").filter({ hasText: /^エステ$/ }).click();
      await page.locator("button[type='submit']").filter({ hasText: /次へ/ }).click();
      await page.locator("button").filter({ hasText: /^次へ$/ }).click();
      await page.fill("#setup-menu-name", menuName);
      await page.fill("#setup-menu-duration", "60");
      await page.fill("#setup-menu-price", "5000");
      await page.locator("button[type='submit']").filter({ hasText: /完了/ }).click();
      await page.locator("button").filter({ hasText: /^サンプルなしで始める$/ }).click();
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
      // 時間帯依存の挨拶（おはようございます・こんにちは・おつかれさまです）+ サロン名で到達検知
      await expect(page.locator("body")).toContainText(
        /おはようございます|こんにちは|おつかれさまです/,
        { timeout: 10_000 },
      );
      await expect(page.locator("body")).toContainText(salonName);

      // DB 反映を admin client で検証
      const { salon, menus } = await getOwnedSalonAndMenus(userId);
      expect(salon?.name).toBe(salonName);
      expect(menus.length).toBeGreaterThanOrEqual(1);
      const targetMenu = menus.find((m) => m.name === menuName);
      expect(targetMenu).toBeDefined();
      expect(targetMenu?.price).toBe(5000);
      expect(targetMenu?.duration_minutes).toBe(60);
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });
});
