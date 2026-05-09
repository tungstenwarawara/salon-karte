/**
 * @counseling カウンセリング送信APIのエラー系統合テスト
 *
 * /c/[token] でお客様が回答送信した時のエラー応答を網羅。
 * 営業観点: 「お客様にURL送ったのに送信できない」状況をなくすため、
 *           無効/期限切れ/二重送信などのエッジを担保。
 */
import { test, expect, type APIRequestContext } from "@playwright/test";
import { COUNSELING } from "../fixtures/test-data";

test.use({ storageState: { cookies: [], origins: [] } });

const skipIfNoServiceKey = !process.env.SUPABASE_SERVICE_ROLE_KEY;

async function postSubmit(
  request: APIRequestContext,
  token: string,
  body: Record<string, unknown>,
) {
  return request.post(`/api/counseling/${token}`, {
    data: body,
    headers: { "Content-Type": "application/json" },
  });
}

test.describe("@counseling カウンセリング送信API", () => {
  test.skip(() => skipIfNoServiceKey, "SUPABASE_SERVICE_ROLE_KEY が未設定のためスキップ");

  test("CS-API-02: responses 空オブジェクト → 400 「回答データが必要」", async ({
    request,
  }) => {
    const res = await postSubmit(request, COUNSELING.pendingToken, { responses: {} });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("回答データ");
  });

  test("CS-API-03: 巨大な responses (100KB+) → 400 「回答データが大きすぎ」", async ({
    request,
  }) => {
    // JSON.stringify(responses).length > 100_000 を確実に超える長さ
    const huge = "a".repeat(110_000);
    const res = await postSubmit(request, COUNSELING.pendingToken, {
      responses: { q1: huge },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("大きすぎ");
  });

  test("CS-API-04: 無効なトークン → 404 「無効なリンク」", async ({ request }) => {
    const res = await postSubmit(request, "invalid-token-e2e-test", {
      responses: { q1: "answer" },
    });
    expect(res.status()).toBe(404);
    expect((await res.json()).error).toContain("無効なリンク");
  });

  test("CS-API-05: 既に回答済みトークン → 400 「既に回答済み」", async ({ request }) => {
    const res = await postSubmit(request, COUNSELING.submittedToken, {
      responses: { q1: "answer" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("既に回答済み");
  });
});
