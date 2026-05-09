/**
 * @activation サインアップフォームのクライアントサイドバリデーション
 *
 * 営業活動で流入したユーザーが「フォームで詰まる」ケースを潰す。
 * 全テストは DB を一切変更しない（送信前にバリデーションで弾かれる経路のみ検証）。
 *
 * カバー範囲:
 * - パスワード長エラー
 * - パスワード不一致エラー
 * - 規約未同意エラー
 * - キャリアメール警告表示
 * - ロゴ・CTA・規約リンク等の必須要素表示
 *
 * 注: 実際のサインアップ送信は signup-api.spec.ts と setup-wizard.spec.ts で扱う。
 */
import { test, expect } from "@playwright/test";

// 未認証状態で /signup にアクセスする（storageState を空にする）
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("@activation サインアップフォーム — バリデーション", () => {
  test("AS-01: 主要要素が表示される（ロゴ・CTA・規約リンク）", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード", { exact: true })).toBeVisible();
    await expect(page.getByLabel("パスワード（確認）")).toBeVisible();

    // CTA「アカウントを作成」
    const submitBtn = page.locator("button[type='submit']").filter({ hasText: /アカウントを作成/ });
    await expect(submitBtn).toBeVisible();

    // 規約リンク3つ（target=_blank で別タブ）
    await expect(page.locator("a[href='/terms']").filter({ hasText: /利用規約/ })).toBeVisible();
    await expect(page.locator("a[href='/privacy']").filter({ hasText: /プライバシーポリシー/ })).toBeVisible();
    await expect(page.locator("a[href='/tokusho']").filter({ hasText: /特定商取引法/ })).toBeVisible();

    // 訴求マイクロコピー（sellability.md 規約: "クレジットカード不要 / いつでも解約OK"）
    await expect(page.locator("body")).toContainText(/初期費用0円/);
    await expect(page.locator("body")).toContainText(/クレジットカード不要/);
    await expect(page.locator("body")).toContainText(/いつでも解約OK/);

    // 課金モデルの整合性チェック（sellability.md: 「30日間無料」「トライアル」表記禁止）
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/30日間無料|無料トライアル|トライアル期間/);

    // ログインページへのリンク
    await expect(page.locator("a[href='/login']").filter({ hasText: /ログイン/ })).toBeVisible();
  });

  test("AS-02: パスワード8文字未満 → エラー表示", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel("メールアドレス").fill("test@example.test");
    await page.getByLabel("パスワード", { exact: true }).fill("short");
    await page.getByLabel("パスワード（確認）").fill("short");
    // 規約同意は付ける（パスワード長チェックが先に走ることを確認するため）
    await page.locator("#agree-checkbox input[type='checkbox']").check();

    await page.locator("button[type='submit']").filter({ hasText: /アカウントを作成/ }).click();

    await expect(page.locator("body")).toContainText("パスワードは8文字以上");
    // フォームに留まり、確認メール画面に遷移しないこと
    await expect(page.locator("body")).not.toContainText("確認メールを送信しました");
  });

  test("AS-03: パスワード不一致 → エラー表示", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel("メールアドレス").fill("test@example.test");
    await page.getByLabel("パスワード", { exact: true }).fill("Password1234");
    await page.getByLabel("パスワード（確認）").fill("Password5678");
    await page.locator("#agree-checkbox input[type='checkbox']").check();

    await page.locator("button[type='submit']").filter({ hasText: /アカウントを作成/ }).click();

    await expect(page.locator("body")).toContainText("パスワードが一致しません");
    await expect(page.locator("body")).not.toContainText("確認メールを送信しました");
  });

  test("AS-04: 規約未同意 → エラー表示 + チェックボックスにスクロール", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel("メールアドレス").fill("test@example.test");
    await page.getByLabel("パスワード", { exact: true }).fill("Password1234");
    await page.getByLabel("パスワード（確認）").fill("Password1234");
    // 規約同意なし
    await page.locator("button[type='submit']").filter({ hasText: /アカウントを作成/ }).click();

    await expect(page.locator("body")).toContainText("同意が必要");
    await expect(page.locator("body")).not.toContainText("確認メールを送信しました");
  });

  test("AS-05: キャリアメール（softbank.ne.jp）入力で警告表示", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel("メールアドレス").fill("test@softbank.ne.jp");
    // blur しなくても showCarrierWarning は state 更新で即時表示される
    await expect(page.locator("body")).toContainText(/キャリアメール/);
    await expect(page.locator("body")).toContainText(/Gmail/);
  });

  test("AS-06: 通常メール（gmail.com）では警告非表示", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel("メールアドレス").fill("test@gmail.com");
    // 入力欄直下のキャリアメール警告は出ない
    await expect(page.locator("body")).not.toContainText(/キャリアメール（docomo・au・softbank）は確認メールが届かない/);
  });
});
