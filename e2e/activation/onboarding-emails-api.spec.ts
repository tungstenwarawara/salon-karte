/**
 * @activation /api/cron/onboarding-emails の統合テスト
 *
 * 認証保護とハッピーパスの基本動作を検証する。実メール送信は RESEND_API_KEY
 * 次第なので、レスポンス JSON 構造（ok / stats）の確認に留める。
 */
import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("@activation オンボーディングメールCron API", () => {
  test("OE-API-01: 認証ヘッダーなし → 401", async ({ request }) => {
    test.skip(!process.env.CRON_SECRET, "CRON_SECRET 未設定時はサーバーが 500 を返すためスキップ");
    const res = await request.get("/api/cron/onboarding-emails");
    expect(res.status()).toBe(401);
  });

  test("OE-API-02: 誤った Bearer トークン → 401", async ({ request }) => {
    test.skip(!process.env.CRON_SECRET, "CRON_SECRET 未設定時はサーバーが 500 を返すためスキップ");
    const res = await request.get("/api/cron/onboarding-emails", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    expect(res.status()).toBe(401);
  });

  test("OE-API-03: 正しい認証 → 200 + ok:true", async ({ request }) => {
    const cronSecret = process.env.CRON_SECRET;
    test.skip(!cronSecret, "CRON_SECRET が未設定のためスキップ");

    const res = await request.get("/api/cron/onboarding-emails", {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // RESEND_API_KEY 未設定なら skipped、設定済みなら stats が返る
    if (!body.skipped) {
      expect(body.stats).toHaveProperty("day3_no_customer");
      expect(body.stats).toHaveProperty("day7_no_record");
      expect(body.stats).toHaveProperty("day14_no_second_record");
    }
  });
});
