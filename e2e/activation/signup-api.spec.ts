/**
 * @activation /api/auth/signup の統合テスト
 *
 * フォームから送信されるパスを実際にDBまで通して検証する。
 * 重複メール検出は営業活動で「2回目の試行」が起きやすい場面なので最重要。
 *
 * クリーンアップ: 各テストで作成した auth.users を必ず削除する。
 */
import { test, expect } from "@playwright/test";
import {
  ACTIVATION_PASSWORD,
  cleanupActivationUser,
  cleanupActivationUserByEmail,
  createConfirmedUser,
  generateActivationEmail,
} from "../fixtures/test-users";

test.use({ storageState: { cookies: [], origins: [] } });

/** /signup フォームを送信する共通操作 */
async function submitSignupForm(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/signup");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード", { exact: true }).fill(password);
  await page.getByLabel("パスワード（確認）").fill(password);
  await page.locator("#agree-checkbox input[type='checkbox']").check();
  await page.locator("button[type='submit']").filter({ hasText: /アカウントを作成/ }).click();
}

test.describe("@activation サインアップAPI — 統合", () => {
  test("AS-API-01: 新規メール → 確認メール送信画面に遷移", async ({ page }) => {
    const email = generateActivationEmail();
    try {
      await submitSignupForm(page, email, ACTIVATION_PASSWORD);

      // emailSent 画面に遷移
      await expect(page.locator("body")).toContainText("確認メールを送信しました", {
        timeout: 15_000,
      });
      await expect(page.locator("body")).toContainText(email);

      // 再送ボタンが表示される
      await expect(
        page.locator("button").filter({ hasText: /確認メールを再送する/ }),
      ).toBeVisible();
    } finally {
      await cleanupActivationUserByEmail(email);
    }
  });

  test("AS-API-02: 確認済みユーザーで重複 → 「既に登録」エラー（ログイン誘導）", async ({
    page,
  }) => {
    // 営業流入したオーナーが過去に登録済みの場合、ログインに誘導する文言が出ること。
    // route 側で email_exists code を検出して409を返す。
    const email = generateActivationEmail();
    const { userId } = await createConfirmedUser(email);
    try {
      await submitSignupForm(page, email, ACTIVATION_PASSWORD);

      await expect(page.locator("body")).toContainText(/既に登録/, { timeout: 15_000 });
      await expect(page.locator("body")).toContainText(/ログインページ/);
      // 確認メール送信画面に遷移しないこと
      await expect(page.locator("body")).not.toContainText("確認メールを送信しました");
    } finally {
      await cleanupActivationUser(userId, email);
    }
  });

  test("AS-API-03: 未確認ユーザーで重複 → 再送扱い（emailSent画面）", async ({ page }) => {
    // Supabase の generateLink は未確認ユーザー宛なら新しいリンクを再生成する仕様
    // = ユーザーがパスワードを思い出さず再登録しても、確認メール再送として動く（営業観点でも妥当）
    const email = generateActivationEmail();
    try {
      // 1回目: 未確認ユーザー作成（フォーム経由）
      await submitSignupForm(page, email, ACTIVATION_PASSWORD);
      await expect(page.locator("body")).toContainText("確認メールを送信しました", {
        timeout: 15_000,
      });

      // 2回目: 同じメール（未確認のまま）で再登録 → emailSent 画面が再表示される
      await submitSignupForm(page, email, ACTIVATION_PASSWORD);
      await expect(page.locator("body")).toContainText("確認メールを送信しました", {
        timeout: 15_000,
      });
    } finally {
      await cleanupActivationUserByEmail(email);
    }
  });
});
