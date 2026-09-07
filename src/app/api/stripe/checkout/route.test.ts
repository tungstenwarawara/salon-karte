import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Checkout API の「誰に決済画面を出すか」を固定するテスト。
 *
 * 守りたい不変条件:
 * 1. 契約中のサロンには絶対に2本目の決済を作らせない（二重課金）
 * 2. 運営が手動で standard を付与したサロン（Stripe 契約なし）は
 *    支払いを開始できる。ここを塞ぐと、課金したいお客様の手段が無くなる
 *
 * 2 のために plan_type による門前払いを外したので、
 * 1 が別の判定で維持されていることをテストで固定する。
 */

const mocks = vi.hoisted(() => ({
  authAndSalon: { current: null as unknown as ReturnType<typeof buildAuth> },
  listCustomers: vi.fn(),
  listSubscriptions: vi.fn(),
  createSession: vi.fn(),
  adminFrom: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    customers: { list: mocks.listCustomers },
    subscriptions: { list: mocks.listSubscriptions },
    checkout: { sessions: { create: mocks.createSession } },
  }),
}));

vi.mock("@/lib/supabase/auth-helpers", () => ({
  getAuthAndSalon: () => mocks.authAndSalon.current,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mocks.adminFrom }),
}));

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

import { POST } from "@/app/api/stripe/checkout/route";

type SubRow = { stripe_customer_id: string; status: string } | null;

/**
 * getAuthAndSalon の戻り値を組み立てる。
 * ルートが使う Supabase クエリは subscriptions と referrals の2本だけ
 */
function buildAuth(planType: "free" | "standard", subRow: SubRow) {
  const chain = (result: unknown) => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      is: () => builder,
      maybeSingle: async () => ({ data: result, error: null }),
    };
    return builder;
  };

  return {
    user: { id: "user-1", email: "owner@example.com" },
    salon: { id: "salon-1", plan_type: planType },
    supabase: {
      from: (table: string) =>
        table === "subscriptions" ? chain(subRow) : chain(null),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ID = "price_test";
  mocks.listCustomers.mockResolvedValue({ data: [] });
  mocks.listSubscriptions.mockResolvedValue({ data: [] });
  mocks.createSession.mockResolvedValue({
    url: "https://checkout.stripe.com/session",
  });
});

describe("POST /api/stripe/checkout", () => {
  it("契約中（subscriptions.status=active）のサロンは決済画面を作らない", async () => {
    mocks.authAndSalon.current = buildAuth("standard", {
      stripe_customer_id: "cus_live",
      status: "active",
    });

    const res = await POST();

    expect(res.status).toBe(400);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("支払い遅延中（past_due）も決済画面を作らない", async () => {
    mocks.authAndSalon.current = buildAuth("standard", {
      stripe_customer_id: "cus_live",
      status: "past_due",
    });

    const res = await POST();

    expect(res.status).toBe(400);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("手動付与の standard（契約行なし）は決済画面を作れる", async () => {
    mocks.authAndSalon.current = buildAuth("standard", null);

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe("https://checkout.stripe.com/session");
    expect(mocks.createSession).toHaveBeenCalledOnce();
  });

  it("手動付与でも Stripe 側に契約があれば決済画面を作らない", async () => {
    mocks.authAndSalon.current = buildAuth("standard", null);
    mocks.listCustomers.mockResolvedValue({ data: [{ id: "cus_found" }] });
    mocks.listSubscriptions.mockResolvedValue({
      data: [{ id: "sub_live", status: "active" }],
    });

    const res = await POST();

    expect(res.status).toBe(409);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("手動付与で Stripe の照合に失敗したら決済を進めない（fail closed）", async () => {
    mocks.authAndSalon.current = buildAuth("standard", null);
    mocks.listCustomers.mockRejectedValue(new Error("Stripe timeout"));

    const res = await POST();

    expect(res.status).toBe(503);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("おためしプランは従来どおり決済画面を作れる", async () => {
    mocks.authAndSalon.current = buildAuth("free", null);

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe("https://checkout.stripe.com/session");
  });

  it("解約済み（canceled）のサロンは再契約できる", async () => {
    mocks.authAndSalon.current = buildAuth("free", {
      stripe_customer_id: "cus_old",
      status: "canceled",
    });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(mocks.createSession).toHaveBeenCalledOnce();
  });
});
