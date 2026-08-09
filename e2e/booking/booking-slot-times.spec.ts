/**
 * @booking 予約開始時間の指定（booking_settings.slot_mode = "fixed"）
 *
 * サロンが「10:00と13:00の2枠だけ受け付けたい」という運用をできるかを検証する。
 * 営業時間を30分刻みで機械的に埋めるのではなく、指定した時刻だけを
 * お客様に見せられること、かつ指定外の時刻を直接POSTしても弾かれることを確認する。
 *
 * 安全性: booking_settings を書き換えるため、全テストで finally により元の値へ復元する。
 *         予約レコードは作成しない（メール送信等の副作用を避けるため）。
 */
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEST_SALON, MENUS } from "../fixtures/test-data";

test.use({ storageState: { cookies: [], origins: [] } });

const skipIfNoServiceKey = !process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 30日以上先の営業日を返す
 * テストサロンは日曜休業（seed-test-data.ts）なので日曜は避ける。
 * 当日判定・受付締切の影響を受けない十分先の日付にする。
 */
function futureBusinessDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return toDateStr(d);
}

/** booking_settings を一時的に差し替え、必ず元に戻す */
async function withBookingSettings(
  patch: Record<string, unknown>,
  fn: () => Promise<void>,
) {
  const admin = adminClient();
  const { data: before } = await admin
    .from("salons")
    .select("booking_settings")
    .eq("id", TEST_SALON.id)
    .single<{ booking_settings: Record<string, unknown> | null }>();
  const original = before?.booking_settings ?? null;

  try {
    await admin
      .from("salons")
      .update({ booking_settings: { ...(original ?? {}), ...patch } })
      .eq("id", TEST_SALON.id);
    await fn();
  } finally {
    await admin
      .from("salons")
      .update({ booking_settings: original })
      .eq("id", TEST_SALON.id);
  }
}

test.describe("@booking 予約開始時間の指定", () => {
  test.skip(() => skipIfNoServiceKey, "SUPABASE_SERVICE_ROLE_KEY が未設定のためスキップ");

  test("BK-SLOT-01: fixed で 10:00 / 13:00 の2枠だけが返る", async ({ request }) => {
    const date = futureBusinessDate();
    await withBookingSettings(
      { slot_mode: "fixed", slot_times: ["10:00", "13:00"] },
      async () => {
        const res = await request.get(
          `/api/booking/${TEST_SALON.bookingSlug}?date=${date}&duration=60`,
        );
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.slots.map((s: { time: string }) => s.time)).toEqual(["10:00", "13:00"]);
      },
    );
  });

  test("BK-SLOT-02: 3枠に増やすと 10:00 / 13:00 / 15:00 になる", async ({ request }) => {
    const date = futureBusinessDate();
    await withBookingSettings(
      { slot_mode: "fixed", slot_times: ["10:00", "13:00", "15:00"] },
      async () => {
        const res = await request.get(
          `/api/booking/${TEST_SALON.bookingSlug}?date=${date}&duration=60`,
        );
        const body = await res.json();
        expect(body.slots.map((s: { time: string }) => s.time)).toEqual([
          "10:00",
          "13:00",
          "15:00",
        ]);
      },
    );
  });

  test("BK-SLOT-03: 登録順がバラバラでも時刻順に並び、営業時間外は除外される", async ({
    request,
  }) => {
    const date = futureBusinessDate();
    // テストサロンの営業時間は 10:00-20:00（土は19:00まで）
    // 09:00 は開店前、22:00 は閉店後なので除外されるはず
    await withBookingSettings(
      { slot_mode: "fixed", slot_times: ["13:00", "22:00", "10:00", "09:00"] },
      async () => {
        const res = await request.get(
          `/api/booking/${TEST_SALON.bookingSlug}?date=${date}&duration=60`,
        );
        const body = await res.json();
        expect(body.slots.map((s: { time: string }) => s.time)).toEqual(["10:00", "13:00"]);
      },
    );
  });

  test("BK-SLOT-04: interval に戻すと従来どおり30分刻みに戻る", async ({ request }) => {
    const date = futureBusinessDate();
    await withBookingSettings(
      { slot_mode: "interval", slot_times: [] },
      async () => {
        const res = await request.get(
          `/api/booking/${TEST_SALON.bookingSlug}?date=${date}&duration=60`,
        );
        const times = (await res.json()).slots.map((s: { time: string }) => s.time);
        expect(times[0]).toBe("10:00");
        expect(times).toContain("10:30");
        expect(times).toContain("11:00");
        // 10:00-20:00（土は19:00）を30分刻み → 18枠以上
        expect(times.length).toBeGreaterThanOrEqual(18);
      },
    );
  });

  test("BK-SLOT-05: 指定外の時刻を直接POSTしても409で弾かれる", async ({ request }) => {
    const date = futureBusinessDate();
    const admin = adminClient();
    const { data: menu } = await admin
      .from("treatment_menus")
      .select("id")
      .eq("salon_id", TEST_SALON.id)
      .eq("is_active", true)
      .limit(1)
      .single<{ id: string }>();

    await withBookingSettings(
      { slot_mode: "fixed", slot_times: ["10:00", "13:00"] },
      async () => {
        const res = await request.post(
          `/api/booking/${TEST_SALON.bookingSlug}/submit`,
          {
            data: {
              date,
              start_time: "11:00", // slot_times に無い時刻
              menu_ids: [menu!.id],
              last_name: "テスト",
              first_name: "枠外",
              email: "e2e-slot@example.test",
              phone: "09000000000",
              memo: "",
            },
            headers: { "Content-Type": "application/json" },
          },
        );
        expect(res.status()).toBe(409);
        expect((await res.json()).error).toContain("この時間帯は予約できません");
      },
    );
  });

  test("BK-SLOT-06: 公開予約ページに指定した2枠だけが表示される", async ({
    browser,
    baseURL,
  }) => {
    await withBookingSettings(
      { slot_mode: "fixed", slot_times: ["10:00", "13:00"] },
      async () => {
        const context = await browser.newContext({
          baseURL,
          storageState: { cookies: [], origins: [] },
        });
        const page = await context.newPage();

        await page.goto(`/book/${TEST_SALON.bookingSlug}`);
        await page.waitForLoadState("networkidle");

        // Step 1: メニュー選択 → 次へ
        // メニューは button として描画される。"button, div" のような緩い指定だと
        // メニュー一覧を囲む外側の div にマッチし、本番ビルドのレイアウトでは
        // クリック位置がずれて別のメニューを選んでしまう
        await page
          .getByRole("button", { name: new RegExp(MENUS.decollete.name) })
          .click();
        const nextBtn = page.getByRole("button", { name: "次へ", exact: true });
        await expect(nextBtn).toBeEnabled();
        await nextBtn.click();

        // Step 2: 翌週に送って「今日より後の日付」だけの週にする
        const nextWeek = page.locator(
          'button:has(path[d="M8.25 4.5l7.5 7.5-7.5 7.5"])',
        );
        await expect(nextWeek).toBeVisible();
        await nextWeek.click();

        // 週内の予約可能な日をクリック（日曜は disabled）
        const dayButtons = page.locator("div.grid-cols-7 > button:not([disabled])");
        await expect(dayButtons.first()).toBeVisible();
        await dayButtons.first().click();

        // 時間スロットは指定した2枠のみ
        const timeButtons = page.locator("div.grid-cols-4 > button");
        await expect(timeButtons).toHaveCount(2);
        await expect(timeButtons.nth(0)).toHaveText("10:00");
        await expect(timeButtons.nth(1)).toHaveText("13:00");

        await context.close();
      },
    );
  });

  /**
   * 退行ガード: Cookie同意バナーは fixed bottom-0 z-50 のため、対策がないと
   * 予約フォーム下端の「次へ」を覆ってお客様が先に進めなくなる。
   * バナーは NEXT_PUBLIC_GA4_ID が設定された環境（＝本番）でのみ表示されるため、
   * 本番URLに対して実行したときにこのテストが本来の意味を持つ。
   */
  test("BK-SLOT-07: Cookie同意バナーが出ていても「次へ」を押して先に進める", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] }, // 同意履歴なし＝バナーが出る状態
    });
    const page = await context.newPage();

    await page.goto(`/book/${TEST_SALON.bookingSlug}`);
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("button", { name: new RegExp(MENUS.decollete.name) })
      .click();

    const nextBtn = page.getByRole("button", { name: "次へ", exact: true });
    await expect(nextBtn).toBeEnabled();
    // バナーに覆われていると、ここで actionability タイムアウトになる
    await nextBtn.click({ timeout: 10_000 });

    // 日時選択ステップ（週ナビ）に到達できたことを確認
    await expect(
      page.locator('button:has(path[d="M8.25 4.5l7.5 7.5-7.5 7.5"])'),
    ).toBeVisible();

    await context.close();
  });
});
