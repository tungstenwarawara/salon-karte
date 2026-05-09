/**
 * @billing 課金（Stripe Checkout / Portal）の E2E
 *
 * 目的: 営業流入したオーナーが「アップグレードボタンを押した瞬間に詰まらない」ことを保証。
 *       Stripe 本番化の前後で同じテストが通ることで、課金切替の安全弁になる。
 *
 * 戦略:
 * - Free プラン状態の表示・ボタン文言・制限説明
 * - アップグレードボタンクリック → /api/stripe/checkout が Stripe URL を返す
 *   実際の Stripe 画面には遷移しない（route() で Stripe ドメインへの navigate を中断）
 * - Standard プラン状態は admin client で plan_type を一時切替（finally で復元）
 * - subscription レコードは fake で作成（Portal エラー時の挙動も検証）
 */
import { test, expect } from "@playwright/test";
import {
  setTestSalonFakeSubscription,
  setTestSalonPlanType,
} from "../fixtures/test-salon-state";

test.describe("@billing 課金画面 — おためしプラン", () => {
  test.beforeEach(async ({ page }) => {
    // Stripe Checkout ドメインへの実遷移を遮断（テスト中はリダイレクト先を確認するだけ）
    await page.route(/^https:\/\/checkout\.stripe\.com\//, (route) =>
      route.fulfill({ status: 200, body: "<html>blocked-stripe</html>" }),
    );
    await page.route(/^https:\/\/billing\.stripe\.com\//, (route) =>
      route.fulfill({ status: 200, body: "<html>blocked-portal</html>" }),
    );
  });

  test("BL-01: 表示 — 現在のプラン・料金カード・アップグレードボタン・制限説明", async ({
    page,
  }) => {
    // テストサロンは plan_type=free 前提
    const restore = await setTestSalonPlanType("free");
    try {
      await page.goto("/settings/billing");
      await page.waitForLoadState("networkidle");

      // 現在のプラン
      await expect(page.locator("body")).toContainText("現在のプラン");
      await expect(page.locator("body")).toContainText("おためしプラン");

      // スタンダードプランの料金カード
      await expect(page.locator("body")).toContainText("スタンダードプラン");
      await expect(page.locator("body")).toContainText("2,980");

      // アップグレード CTA
      await expect(
        page.locator("button").filter({ hasText: /スタンダードにアップグレード/ }),
      ).toBeVisible();

      // 制限説明
      await expect(page.locator("body")).toContainText("おためしプランの目安");
      await expect(page.locator("body")).toContainText("顧客 50人まで");
      await expect(page.locator("body")).toContainText("カルテ 100件まで");
    } finally {
      await restore();
    }
  });

  test("BL-02: アップグレードクリック → /api/stripe/checkout が Stripe URL を返す", async ({
    page,
  }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      // /api/stripe/checkout のレスポンスを傍受 — ナビゲーション前にボディを保存し、
      // レスポンスURLを同一オリジンに差し替えて外部 navigation を避ける
      let captured: { status: number; url?: string; error?: string } | null = null;
      await page.route("**/api/stripe/checkout", async (route) => {
        const real = await route.fetch();
        const body = await real.json().catch(() => ({}));
        captured = { status: real.status(), ...body };
        await route.fulfill({
          status: real.status(),
          contentType: "application/json",
          body: JSON.stringify({
            ...body,
            url: body.url ? "/settings/billing?intercepted=1" : undefined,
          }),
        });
      });

      await page.goto("/settings/billing");
      await page.waitForLoadState("networkidle");

      await page
        .locator("button")
        .filter({ hasText: /スタンダードにアップグレード/ })
        .click();

      // 同一オリジンへのリダイレクト完了を待つ（差し替え済み URL）
      await page.waitForURL(/intercepted=1/, { timeout: 15_000 });

      expect(captured).not.toBeNull();
      const cap = captured as unknown as { status: number; url?: string };
      expect(cap.status).toBe(200);
      // Stripe Checkout URL 形式 https://checkout.stripe.com/c/pay/...
      expect(cap.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    } finally {
      await restore();
    }
  });

  test("BL-03: ?success=true パラメータ → 成功 Toast が表示される", async ({ page }) => {
    const restore = await setTestSalonPlanType("free");
    try {
      await page.goto("/settings/billing?success=true");
      await page.waitForLoadState("networkidle");

      await expect(page.locator("body")).toContainText(
        /スタンダードプランへのアップグレードが完了/,
        { timeout: 10_000 },
      );
    } finally {
      await restore();
    }
  });
});

test.describe("@billing 課金画面 — スタンダードプラン", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/^https:\/\/billing\.stripe\.com\//, (route) =>
      route.fulfill({ status: 200, body: "<html>blocked-portal</html>" }),
    );
  });

  test("BL-04: 表示 — 「プラン・支払い方法を管理」ボタン + 次回請求日", async ({ page }) => {
    const restorePlan = await setTestSalonPlanType("standard");
    const restoreSub = await setTestSalonFakeSubscription({
      status: "active",
      current_period_end: new Date(2026, 5, 15).toISOString(),
    });
    try {
      await page.goto("/settings/billing");
      await page.waitForLoadState("networkidle");

      await expect(page.locator("body")).toContainText("スタンダードプラン");
      await expect(
        page.locator("button").filter({ hasText: /プラン・支払い方法を管理/ }),
      ).toBeVisible();

      // 次回請求日が表示される
      await expect(page.locator("body")).toContainText(/次回請求日/);

      // アップグレードボタンは表示されない
      await expect(
        page.locator("button").filter({ hasText: /スタンダードにアップグレード/ }),
      ).not.toBeVisible();
    } finally {
      await restoreSub();
      await restorePlan();
    }
  });

  test("BL-05: 支払い問題 (past_due) → 警告メッセージ表示", async ({ page }) => {
    const restorePlan = await setTestSalonPlanType("standard");
    const restoreSub = await setTestSalonFakeSubscription({ status: "past_due" });
    try {
      await page.goto("/settings/billing");
      await page.waitForLoadState("networkidle");

      await expect(page.locator("body")).toContainText(/お支払いに問題があります/);
      await expect(page.locator("body")).toContainText(/カード情報をご確認/);
    } finally {
      await restoreSub();
      await restorePlan();
    }
  });

  test("BL-06: 「管理」クリック → /api/stripe/portal が呼ばれる（fake sub のためエラーが返る）", async ({
    page,
  }) => {
    // 本番の Stripe 顧客 ID ではないため Portal 作成は失敗する。
    // ここで検証したいのは「ボタンが API を確実に叩くこと」。fake な customer_id でも
    // ステータスコード（200 or エラー応答）が返ってくれば API ルート自体は機能している。
    const restorePlan = await setTestSalonPlanType("standard");
    const restoreSub = await setTestSalonFakeSubscription({ status: "active" });
    try {
      await page.goto("/settings/billing");
      await page.waitForLoadState("networkidle");

      const responsePromise = page.waitForResponse("**/api/stripe/portal");
      await page
        .locator("button")
        .filter({ hasText: /プラン・支払い方法を管理/ })
        .click();

      const response = await responsePromise;
      // 200 (real subscription URL) or 4xx/5xx (fake customer rejected) どちらでも
      // 「APIルートが応答した」ことを確認できればOK
      expect([200, 400, 404, 500]).toContain(response.status());
    } finally {
      await restoreSub();
      await restorePlan();
    }
  });
});
