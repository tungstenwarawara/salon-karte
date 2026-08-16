import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Stripe Webhook の失敗時挙動を固定するテスト。
 *
 * 守りたい不変条件:
 * 「DB更新に失敗したら 500 を返し、冪等性マーカーを取り消す」
 * ここが壊れると、課金済みなのに plan_type が free のまま恒久固定される
 * （Stripe は 200 を受け取ると再送しないため）。
 * ビルドでも型チェックでも検出できないので、テストで固定する。
 */

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  retrieveSubscription: vi.fn(),
  createBalanceTransaction: vi.fn(),
  notifyOperator: vi.fn(),
  adminClient: { current: null as unknown as ReturnType<typeof createSupabaseMock> },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mocks.constructEvent },
    subscriptions: { retrieve: mocks.retrieveSubscription },
    customers: { createBalanceTransaction: mocks.createBalanceTransaction },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mocks.adminClient.current,
}));

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

// after() は Next.js のリクエストスコープ外では動かないためモックする
vi.mock("@/lib/email/operator-notify", () => ({
  notifyOperatorBillingEvent: mocks.notifyOperator,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

type Outcome = { data?: unknown; error?: unknown };
type RecordedCall = { table: string; op: string; payload?: unknown };

/**
 * Supabase のメソッドチェーンを模したモック。
 * `${テーブル名}.${操作}` をキーに返り値を差し込む。
 */
function createSupabaseMock(config: Record<string, Outcome>) {
  const calls: RecordedCall[] = [];

  const from = (table: string) => {
    let op = "select";
    let payload: unknown;

    const outcome = () => {
      const res = config[`${table}.${op}`] ?? {};
      return { data: res.data ?? null, error: res.error ?? null };
    };

    const record = (nextOp: string, values?: unknown) => {
      op = nextOp;
      payload = values;
      calls.push({ table, op, payload });
    };

    const builder = {
      select: () => builder,
      eq: () => builder,
      is: () => builder,
      insert: (values: unknown) => (record("insert", values), builder),
      upsert: (values: unknown) => (record("upsert", values), builder),
      update: (values: unknown) => (record("update", values), builder),
      delete: () => (record("delete"), builder),
      maybeSingle: async () => outcome(),
      single: async () => outcome(),
      then: (resolve: (value: Outcome) => unknown) =>
        Promise.resolve(outcome()).then(resolve),
    };

    return builder;
  };

  return { from, calls };
}

/** 実際に届いた 2026-08-15 の成約イベントを模したペイロード */
const CHECKOUT_COMPLETED = {
  id: "evt_test_checkout",
  type: "checkout.session.completed",
  data: {
    object: {
      metadata: { salon_id: "salon-1", user_id: "user-1", referral_id: "" },
      customer: "cus_test",
      subscription: "sub_test",
    },
  },
};

function buildRequest() {
  return new Request("https://salonkarte.com/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "sig_test" },
    body: JSON.stringify({}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  mocks.constructEvent.mockReturnValue(CHECKOUT_COMPLETED);
  mocks.retrieveSubscription.mockResolvedValue({
    items: { data: [{ current_period_end: 1789200000 }] },
    trial_end: null,
  });
});

describe("Stripe Webhook: 正常系", () => {
  it("成約イベントで subscriptions を upsert し plan_type を standard にする", async () => {
    mocks.adminClient.current = createSupabaseMock({
      "stripe_processed_events.insert": {},
      "subscriptions.select": { data: null },
      "subscriptions.upsert": {},
      "salons.update": {},
    });

    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true });

    const { calls } = mocks.adminClient.current;
    const upsert = calls.find((c) => c.table === "subscriptions" && c.op === "upsert");
    expect(upsert?.payload).toMatchObject({
      salon_id: "salon-1",
      stripe_customer_id: "cus_test",
      stripe_subscription_id: "sub_test",
      status: "active",
    });

    const planUpdate = calls.find((c) => c.table === "salons" && c.op === "update");
    expect(planUpdate?.payload).toEqual({ plan_type: "standard" });

    // 成功時はマーカーを消さない
    expect(
      calls.some((c) => c.table === "stripe_processed_events" && c.op === "delete")
    ).toBe(false);
  });

  it("成約が確定したら運営者に通知する", async () => {
    mocks.adminClient.current = createSupabaseMock({
      "stripe_processed_events.insert": {},
      "subscriptions.select": { data: null },
      "subscriptions.upsert": {},
      "salons.update": { data: { name: "テスト美容室" } },
    });

    await POST(buildRequest());

    expect(mocks.notifyOperator).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "subscribed",
        salonName: "テスト美容室",
        salonId: "salon-1",
      })
    );
  });
});

describe("Stripe Webhook: 失敗時の再送可能性（最重要）", () => {
  it("subscriptions の upsert が失敗したら 500 を返す", async () => {
    mocks.adminClient.current = createSupabaseMock({
      "stripe_processed_events.insert": {},
      "subscriptions.select": { data: null },
      "subscriptions.upsert": { error: { message: "書き込み失敗" } },
    });

    const res = await POST(buildRequest());

    expect(res.status).toBe(500);
  });

  it("失敗時は冪等性マーカーを削除し、Stripe の再送を受け付けられる状態に戻す", async () => {
    mocks.adminClient.current = createSupabaseMock({
      "stripe_processed_events.insert": {},
      "subscriptions.select": { data: null },
      "subscriptions.upsert": { error: { message: "書き込み失敗" } },
      "stripe_processed_events.delete": {},
    });

    await POST(buildRequest());

    const { calls } = mocks.adminClient.current;
    expect(
      calls.some((c) => c.table === "stripe_processed_events" && c.op === "delete")
    ).toBe(true);
  });

  it("処理が失敗したときは運営者通知を送らない（再送で重複するため）", async () => {
    mocks.adminClient.current = createSupabaseMock({
      "stripe_processed_events.insert": {},
      "subscriptions.select": { data: null },
      "subscriptions.upsert": { error: { message: "書き込み失敗" } },
      "stripe_processed_events.delete": {},
    });

    await POST(buildRequest());

    expect(mocks.notifyOperator).not.toHaveBeenCalled();
  });

  it("plan_type の更新が失敗した場合も 500 + マーカー削除", async () => {
    mocks.adminClient.current = createSupabaseMock({
      "stripe_processed_events.insert": {},
      "subscriptions.select": { data: null },
      "subscriptions.upsert": {},
      "salons.update": { error: { message: "更新失敗" } },
      "stripe_processed_events.delete": {},
    });

    const res = await POST(buildRequest());

    expect(res.status).toBe(500);
    expect(
      mocks.adminClient.current.calls.some(
        (c) => c.table === "stripe_processed_events" && c.op === "delete"
      )
    ).toBe(true);
  });
});

describe("Stripe Webhook: 冪等性", () => {
  it("処理済みイベントの再送は 200 duplicate で、DB を一切触らない", async () => {
    mocks.adminClient.current = createSupabaseMock({
      // unique violation = 既に処理済み
      "stripe_processed_events.insert": { error: { code: "23505" } },
    });

    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true, duplicate: true });

    // マーカーのINSERT試行以外の書き込みが発生していないこと
    const { calls } = mocks.adminClient.current;
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ table: "stripe_processed_events", op: "insert" });

    // Stripe API も叩かない
    expect(mocks.retrieveSubscription).not.toHaveBeenCalled();
  });
});

describe("Stripe Webhook: 署名検証", () => {
  it("署名ヘッダーが無ければ 400", async () => {
    mocks.adminClient.current = createSupabaseMock({});

    const res = await POST(
      new Request("https://salonkarte.com/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );

    expect(res.status).toBe(400);
  });

  it("署名検証に失敗したら 400 を返し、DB に触れない", async () => {
    mocks.adminClient.current = createSupabaseMock({});
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("署名不一致");
    });

    const res = await POST(buildRequest());

    expect(res.status).toBe(400);
    expect(mocks.adminClient.current.calls).toHaveLength(0);
  });
});

describe("Stripe Webhook: 未知の顧客のイベント", () => {
  it("該当する subscriptions 行が無い解約イベントは 200 で流す（500ループを防ぐ）", async () => {
    mocks.constructEvent.mockReturnValue({
      id: "evt_test_deleted",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_unknown" } },
    });

    mocks.adminClient.current = createSupabaseMock({
      "stripe_processed_events.insert": {},
      "subscriptions.update": { data: null },
    });

    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    // plan_type を勝手に free に戻さない
    expect(
      mocks.adminClient.current.calls.some((c) => c.table === "salons")
    ).toBe(false);
  });
});
