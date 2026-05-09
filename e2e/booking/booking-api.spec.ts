/**
 * @booking 予約送信APIのエラー系統合テスト
 *
 * /book/[slug] 経由でお客様が予約を送信した時、API側で弾かれるパスを網羅。
 * UI経由よりも速く、不正データ・受付停止・存在しないslug等のエッジを検証する。
 *
 * 営業観点: 予約フォームで「送信ボタンを押したけど何も起きない」「謎のエラー」
 *           という状態をなくすため、各エラー応答の文言が読みやすいか確認。
 */
import { test, expect, type APIRequestContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEST_SALON, MENUS } from "../fixtures/test-data";

test.use({ storageState: { cookies: [], origins: [] } });

const skipIfNoServiceKey = !process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Booking submit に必要な最低限の有効ボディ（メニューIDだけは別途差し替え必須） */
function buildValidBody(menuId: string, overrides: Record<string, unknown> = {}) {
  // 30日先の日付を使う（過去日チェック回避）
  const future = new Date();
  future.setDate(future.getDate() + 30);
  const dateStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
  return {
    date: dateStr,
    start_time: "10:00",
    menu_ids: [menuId],
    last_name: "テスト",
    first_name: "予約",
    email: "e2e-booking@example.test",
    phone: "09000000000",
    memo: "",
    ...overrides,
  };
}

/** テストサロンの最初のアクティブメニューIDを取得 */
async function getActiveMenuId(): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await admin
    .from("treatment_menus")
    .select("id")
    .eq("salon_id", TEST_SALON.id)
    .eq("is_active", true)
    .limit(1)
    .single();
  if (!data) throw new Error("有効なテストメニューが見つかりません");
  return data.id;
}

async function postSubmit(
  request: APIRequestContext,
  slug: string,
  body: Record<string, unknown>,
) {
  return request.post(`/api/booking/${slug}/submit`, {
    data: body,
    headers: { "Content-Type": "application/json" },
  });
}

test.describe("@booking 予約送信API — バリデーション", () => {
  test.skip(() => skipIfNoServiceKey, "SUPABASE_SERVICE_ROLE_KEY が未設定のためスキップ");

  test("BK-API-02: 名前空 → 400 「お名前（姓・名）は必須」", async ({ request }) => {
    const menuId = await getActiveMenuId();
    const res = await postSubmit(request, TEST_SALON.bookingSlug, {
      ...buildValidBody(menuId),
      last_name: "",
      first_name: "",
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("お名前");
  });

  test("BK-API-03: 不正なメール → 400 「メールアドレスの形式」", async ({ request }) => {
    const menuId = await getActiveMenuId();
    const res = await postSubmit(request, TEST_SALON.bookingSlug, {
      ...buildValidBody(menuId),
      email: "not-an-email",
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("メールアドレス");
  });

  test("BK-API-04: 不正な電話番号 → 400 「電話番号の形式」", async ({ request }) => {
    const menuId = await getActiveMenuId();
    const res = await postSubmit(request, TEST_SALON.bookingSlug, {
      ...buildValidBody(menuId),
      phone: "abc-def",
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("電話番号");
  });

  test("BK-API-05: 過去の日付 → 400 「過去の日付」", async ({ request }) => {
    const menuId = await getActiveMenuId();
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;
    const res = await postSubmit(request, TEST_SALON.bookingSlug, {
      ...buildValidBody(menuId),
      date: pastStr,
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("過去の日付");
  });

  test("BK-API-06: メニューID空配列 → 400 「メニューを1つ以上」", async ({ request }) => {
    const menuId = await getActiveMenuId();
    const res = await postSubmit(request, TEST_SALON.bookingSlug, {
      ...buildValidBody(menuId),
      menu_ids: [],
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("メニュー");
  });

  test("BK-API-07: メモ501文字 → 400 「500文字以内」", async ({ request }) => {
    const menuId = await getActiveMenuId();
    const res = await postSubmit(request, TEST_SALON.bookingSlug, {
      ...buildValidBody(menuId),
      memo: "あ".repeat(501),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("500文字以内");
  });

  test("BK-API-08: 存在しないslug → 404 「予約ページが見つかりません」", async ({ request }) => {
    const menuId = await getActiveMenuId();
    const res = await postSubmit(request, "invalid-slug-e2e-test", buildValidBody(menuId));
    expect(res.status()).toBe(404);
    expect((await res.json()).error).toContain("見つかりません");
  });

  test("BK-API-09: ハニーポット トリガー → 200 サイレント拒否", async ({ request }) => {
    const menuId = await getActiveMenuId();
    const res = await postSubmit(request, TEST_SALON.bookingSlug, {
      ...buildValidBody(menuId),
      _hp: "bot-filled-this",
    });
    // ボットには成功を返すが、実際には予約は作成されない
    expect(res.status()).toBe(200);
  });

  test("BK-API-10: 不正なメニューID → 400 「選択されたメニューが見つかりません」", async ({
    request,
  }) => {
    const res = await postSubmit(
      request,
      TEST_SALON.bookingSlug,
      buildValidBody("00000000-0000-0000-0000-999999999999"),
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("メニュー");
  });
});

test.describe("@booking 予約受付停止状態", () => {
  test.skip(() => skipIfNoServiceKey, "SUPABASE_SERVICE_ROLE_KEY が未設定のためスキップ");

  test("BK-API-11: booking_enabled=false → 403 + BOOKING_DISABLED コード", async ({
    request,
  }) => {
    // テストサロンの booking_enabled を一時的に false に
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 現状取得
    const { data: original } = await admin
      .from("salons")
      .select("booking_enabled")
      .eq("id", TEST_SALON.id)
      .single();
    const originalEnabled = original?.booking_enabled ?? true;

    try {
      // false に切替
      await admin
        .from("salons")
        .update({ booking_enabled: false })
        .eq("id", TEST_SALON.id);

      const menuId = await getActiveMenuId();
      const res = await postSubmit(request, TEST_SALON.bookingSlug, buildValidBody(menuId));
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.code).toBe("BOOKING_DISABLED");
      expect(body.error).toMatch(/受付を停止|お問い合わせ/);
    } finally {
      // 元に戻す
      await admin
        .from("salons")
        .update({ booking_enabled: originalEnabled })
        .eq("id", TEST_SALON.id);
    }
  });

  test("BK-UI-12: booking_enabled=false → 公開ページに「停止中」UI が表示される", async ({
    page,
  }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: original } = await admin
      .from("salons")
      .select("booking_enabled")
      .eq("id", TEST_SALON.id)
      .single();
    const originalEnabled = original?.booking_enabled ?? true;

    try {
      await admin
        .from("salons")
        .update({ booking_enabled: false })
        .eq("id", TEST_SALON.id);

      await page.goto(`/book/${TEST_SALON.bookingSlug}`);
      await page.waitForLoadState("networkidle");

      // 受付停止メッセージが表示される（UI の文言は "停止" or "お問い合わせ" を含むはず）
      await expect(page.locator("body")).toContainText(/停止|お問い合わせ|現在/);
      // メニュー一覧は表示されない
      await expect(page.locator("body")).not.toContainText(MENUS.facialBasic.name);
    } finally {
      await admin
        .from("salons")
        .update({ booking_enabled: originalEnabled })
        .eq("id", TEST_SALON.id);
    }
  });
});
