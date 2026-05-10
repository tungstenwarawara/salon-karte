/**
 * @plan-gate プラン制限・機能ロック・プラン状態UI の E2E
 *
 * 目的:
 * - 機能ゲート（Free 不可機能のロック画面）が正しく出る
 * - プラン状態カード・使用状況バーが正しく描画される
 * - スタンダードプランのユーザーには制限が表示されない
 *
 * テストサロンの初期データ（25顧客・30カルテ・15予約）は制限値（50/100/30）未満。
 * なので「制限到達モーダル」自体は通常出ないが、各種UI要素の存在を検証する。
 */
import { test, expect, type Page } from "@playwright/test";
import { setTestSalonPlanType } from "../fixtures/test-salon-state";

async function gotoAndWait(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

test.describe("@plan-gate ダッシュボード — プラン状態カード", () => {
  test("PG-01: free プラン → 「おためしプラン ¥0/月」と使用状況サマリが表示", async ({
    page,
  }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      await gotoAndWait(page, "/dashboard");

      // プラン状態カードに「おためしプラン」表示
      await expect(page.locator("body")).toContainText("おためしプラン");
      await expect(page.locator("body")).toContainText("¥0/月");

      // 使用状況サマリ（顧客 N/50 ・ カルテ N/100）
      await expect(page.locator("body")).toContainText(/顧客.*\/50/);
      await expect(page.locator("body")).toContainText(/カルテ.*\/100/);
    } finally {
      await restore();
    }
  });

  test("PG-02: standard プラン → 「スタンダードプラン ¥2,980/月」表示・使用状況サマリなし", async ({
    page,
  }) => {
    const restore = await setTestSalonPlanType("standard");
    try {
      await gotoAndWait(page, "/dashboard");

      await expect(page.locator("body")).toContainText("スタンダードプラン");
      await expect(page.locator("body")).toContainText("¥2,980/月");

      // standard には使用状況サマリは出ない（無制限なので）
      await expect(page.locator("body")).not.toContainText(/顧客.*\/50/);
    } finally {
      await restore();
    }
  });
});

test.describe("@plan-gate 料金プランページ — おためしプラン", () => {
  test.beforeEach(async ({ page }) => {
    // Stripe ドメインへの実遷移を遮断
    await page.route(/^https:\/\/checkout\.stripe\.com\//, (route) =>
      route.fulfill({ status: 200, body: "<html>blocked</html>" }),
    );
  });

  test("PG-03: 使用状況バー（顧客・カルテ・予約）が描画される", async ({ page }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      await gotoAndWait(page, "/settings/billing");

      // 使用状況見出し
      await expect(page.locator("body")).toContainText("現在の使用状況");
      // 各項目
      await expect(page.locator("body")).toContainText(/顧客.*\d+.*\/.*50/);
      await expect(page.locator("body")).toContainText(/カルテ.*\d+.*\/.*100/);
      await expect(page.locator("body")).toContainText(/予約.*\/.*30/);
    } finally {
      await restore();
    }
  });

  test("PG-04: ロック中機能（写真・LINE・カウンセリング・売上分析）が表示される", async ({
    page,
  }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      await gotoAndWait(page, "/settings/billing");

      await expect(page.locator("body")).toContainText("施術写真");
      await expect(page.locator("body")).toContainText("LINE連携");
      await expect(page.locator("body")).toContainText("カウンセリングシート");
      await expect(page.locator("body")).toContainText("売上分析");
      // ロックアイコン or 「スタンダードで利用可能」表記
      await expect(page.locator("body")).toContainText(/スタンダードで利用可能/);
    } finally {
      await restore();
    }
  });

  test("PG-05: プラン比較カード（おためし / スタンダード）両方が表示される", async ({
    page,
  }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      await gotoAndWait(page, "/settings/billing");

      await expect(page.locator("body")).toContainText("プラン比較");
      // 価格両方
      await expect(page.locator("body")).toContainText("¥0");
      await expect(page.locator("body")).toContainText("2,980");
      // バッジ
      await expect(page.locator("body")).toContainText("利用中");
      await expect(page.locator("body")).toContainText("おすすめ");
    } finally {
      await restore();
    }
  });

  test("PG-06: アップグレードフロー説明（5ステップ）と FAQ が表示される", async ({
    page,
  }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      await gotoAndWait(page, "/settings/billing");

      await expect(page.locator("body")).toContainText("アップグレードの流れ");
      await expect(page.locator("body")).toContainText("カード情報を登録");
      await expect(page.locator("body")).toContainText("よくある質問");
      // FAQ 項目（detailsで折りたたまれているがテキスト自体は body に含まれる）
      await expect(page.locator("body")).toContainText("制限を超えたら");
      await expect(page.locator("body")).toContainText("解約したらデータ");
    } finally {
      await restore();
    }
  });
});

test.describe("@plan-gate 料金プランページ — スタンダードプラン", () => {
  test("PG-07: standard では使用状況バー・プラン比較が出ない（管理ボタンのみ）", async ({
    page,
  }) => {
    const restore = await setTestSalonPlanType("standard");
    try {
      await gotoAndWait(page, "/settings/billing");

      // standard なら「現在の使用状況」「プラン比較」セクションは出ない
      await expect(page.locator("body")).not.toContainText("現在の使用状況");
      await expect(page.locator("body")).not.toContainText("プラン比較");

      // 「プラン・支払い方法を管理」ボタンは出る
      await expect(
        page.locator("button").filter({ hasText: /プラン・支払い方法を管理/ }),
      ).toBeVisible();

      // FAQ は両プラン共通で出る
      await expect(page.locator("body")).toContainText("よくある質問");
    } finally {
      await restore();
    }
  });
});

test.describe("@plan-gate 機能ロック — Free プラン", () => {
  test("PG-08: LINE設定 → ロック画面表示", async ({ page }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      await gotoAndWait(page, "/settings/line");

      // FeatureLockCard の特徴的な文言
      await expect(page.locator("body")).toContainText(
        /LINE連携はスタンダードプランで利用できます/,
      );
      await expect(page.locator("body")).toContainText(
        /スタンダードにアップグレード/,
      );
      // 通常のLINE設定UI（「LINE連携を有効にする」とか）は出ない
      await expect(page.locator("body")).not.toContainText("Webhook URL");
    } finally {
      await restore();
    }
  });

  test("PG-09: カウンセリングテンプレ → ロック画面表示", async ({ page }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      await gotoAndWait(page, "/settings/counseling-template");

      await expect(page.locator("body")).toContainText(
        /カウンセリングシートはスタンダードプランで利用できます/,
      );
      // 「+ テンプレートを追加」ボタンは出ない
      await expect(
        page.locator("button").filter({ hasText: /\+ テンプレートを追加/ }),
      ).not.toBeVisible();
    } finally {
      await restore();
    }
  });

  test("PG-10: 売上分析 → ロック画面表示", async ({ page }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      await gotoAndWait(page, "/sales/analytics");

      await expect(page.locator("body")).toContainText(
        /売上分析はスタンダードプランで利用できます/,
      );
    } finally {
      await restore();
    }
  });
});

test.describe("@plan-gate 機能ロック — Standard プラン（ロック解除）", () => {
  test("PG-11: standard では LINE設定がロック画面ではなく通常UI", async ({ page }) => {
    const restore = await setTestSalonPlanType("standard");
    try {
      await gotoAndWait(page, "/settings/line");

      // ロック画面の文言は出ない
      await expect(page.locator("body")).not.toContainText(
        /LINE連携はスタンダードプランで利用できます/,
      );
    } finally {
      await restore();
    }
  });

  test("PG-12: standard では売上分析が通常UI", async ({ page }) => {
    const restore = await setTestSalonPlanType("standard");
    try {
      await gotoAndWait(page, "/sales/analytics");

      await expect(page.locator("body")).not.toContainText(
        /売上分析はスタンダードプランで利用できます/,
      );
    } finally {
      await restore();
    }
  });
});

test.describe("@plan-gate サインアップ — 紹介経由", () => {
  test("PG-13: /signup?ref=XXXXXXXX で紹介特典バナーが表示", async ({ browser }) => {
    // ログイン状態をリセットしたい（signupページは未認証用）
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      await page.goto("/signup?ref=TESTCODE");
      await page.waitForLoadState("networkidle");

      // 🎁 + 「紹介特典が適用されます」が出る
      await expect(page.locator("body")).toContainText("紹介特典が適用されます");
      await expect(page.locator("body")).toContainText("最初の30日間が無料");
    } finally {
      await context.close();
    }
  });

  test("PG-14: /signup（紹介コードなし）では紹介特典バナーが出ない", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      await page.goto("/signup");
      await page.waitForLoadState("networkidle");

      // 紹介特典バナーは出ない（通常の「初期費用0円」案内のみ）
      await expect(page.locator("body")).not.toContainText(
        "紹介特典が適用されます",
      );
      await expect(page.locator("body")).toContainText(/初期費用0円/);
    } finally {
      await context.close();
    }
  });
});

test.describe("@plan-gate 顧客一覧 — 制限未到達", () => {
  test("PG-15: free + 25顧客（上限未満）→ 通常の登録ボタン（Link遷移）", async ({
    page,
  }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      await gotoAndWait(page, "/customers");

      // 「+ 顧客を登録」ボタンが Link で /customers/new に飛ぶこと
      const button = page.locator(":is(a, button)").filter({
        hasText: /\+ 顧客を登録/,
      }).first();
      await expect(button).toBeVisible();

      // クリックして遷移
      await button.click();
      await page.waitForURL(/\/customers\/new/, { timeout: 10_000 });
    } finally {
      await restore();
    }
  });
});
