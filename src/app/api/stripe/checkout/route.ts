import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getStripe } from "@/lib/stripe";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

/** 契約中とみなす Stripe サブスクリプションのステータス */
const LIVE_SUBSCRIPTION_STATUSES: Stripe.Subscription.Status[] = [
  "active",
  "trialing",
  "past_due",
];

export async function POST() {
  const { user, salon, supabase } = await getAuthAndSalon();

  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "料金設定が見つかりません" },
      { status: 500 }
    );
  }

  const stripe = getStripe();

  // 二重契約の防止:
  // 決済直後にもう一度このAPIを叩くと2本目のサブスクリプションが作られ二重課金になる。
  // DB の契約行 → Stripe 側の実態 の順に二段で確認する。
  // （1オーナー = 1サロン前提。getAuthAndSalon が single() で解決している）
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("salon_id", salon.id)
    .maybeSingle();

  // 契約中の再チェックアウトは二重課金になるため止める。
  // 判定は plan_type ではなく「Stripe 契約の実態」で行う。
  // 運営が手動で standard を付与したサロン（Stripe 契約なし）は
  // plan_type で弾くと支払いを開始する手段が一切なくなるため
  const hasLiveSubscription =
    existingSub?.status === "active" || existingSub?.status === "past_due";

  if (hasLiveSubscription) {
    return NextResponse.json(
      { error: "すでにスタンダードプランです" },
      { status: 400 }
    );
  }

  // 手動付与で standard になっているサロン。
  // 契約実態が DB に無いだけで、実は Stripe 側に契約が存在する可能性を
  // 通常より厳しく見る（後述の照合失敗時に fail closed にする）
  const grantedWithoutSubscription =
    salon.plan_type === "standard" && !hasLiveSubscription;

  let customerId: string | null = existingSub?.stripe_customer_id ?? null;
  const customerLinkedToSalon = !!customerId;

  // DB に無くても Stripe 側には Customer が出来ている可能性がある
  // （Checkout 完了直後で Webhook 未処理、または Webhook 失敗のケース）。
  // 顧客の重複作成も防げる
  if (!customerId && user.email) {
    try {
      const found = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      customerId = found.data[0]?.id ?? null;
    } catch (err) {
      // 照合できなくても新規 Customer で続行する（決済導線は止めない）
      console.error("Stripe 顧客の照合に失敗:", err);
      Sentry.captureException(err, {
        tags: { feature: "stripe-checkout" },
        extra: { salon_id: salon.id },
      });

      // 手動付与のサロンだけは fail closed にする。
      // 「plan_type は standard なのに契約が DB に無い」状態では、
      // Stripe 側に契約が存在するかどうかを照合でしか判断できない。
      // 照合できないまま進めると二重契約になりうるので、やり直してもらう
      if (grantedWithoutSubscription) {
        return NextResponse.json(
          {
            error:
              "決済システムとの通信に失敗しました。恐れ入りますが、少し時間をおいて再度お試しください。",
          },
          { status: 503 }
        );
      }
    }
  }

  if (customerId) {
    // 照合に失敗しても決済導線は止めない（fail open）。
    // ここで 500 を返すと Stripe 側の一時障害だけで成約を落とす。
    // 二重契約は「既存契約あり ∧ この照合が失敗」の同時成立でしか起きず、
    // 成約機会を確実に失うほうが損失が大きい
    let live: Stripe.Subscription | undefined;
    try {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 10,
      });
      live = subs.data.find((s) =>
        LIVE_SUBSCRIPTION_STATUSES.includes(s.status)
      );
    } catch (err) {
      console.error("Stripe サブスクリプションの照合に失敗:", err);
      Sentry.captureException(err, {
        tags: { feature: "stripe-checkout" },
        extra: { salon_id: salon.id, customer_id: customerId },
      });

      // 手動付与のサロンは fail closed（理由は上の customers.list と同じ）
      if (grantedWithoutSubscription) {
        return NextResponse.json(
          {
            error:
              "決済システムとの通信に失敗しました。恐れ入りますが、少し時間をおいて再度お試しください。",
          },
          { status: 503 }
        );
      }
    }

    if (live) {
      // 契約済みなのに plan_type が free = Webhook の取りこぼし。
      // DB とこのサロンの紐づけが確認できている場合に限り自動復旧する
      if (customerLinkedToSalon) {
        await syncSubscriptionState(salon.id, customerId, live);
        return NextResponse.json(
          {
            error:
              "すでにご契約済みです。プラン情報を再取得しました。画面を再読み込みしてください。",
          },
          { status: 409 }
        );
      }

      const message = `契約済み顧客の再チェックアウトを阻止: salon=${salon.id} customer=${customerId} subscription=${live.id}`;
      console.error(message);
      Sentry.captureException(new Error(message), {
        tags: { feature: "stripe-checkout", severity: "billing" },
        extra: { salon_id: salon.id, customer_id: customerId },
      });
      return NextResponse.json(
        {
          error:
            "すでにご契約済みの可能性があります。反映されない場合はサポートまでご連絡ください。",
        },
        { status: 409 }
      );
    }
  }

  // 紹介特典: このサロンが「被紹介側」かつ被紹介特典が未適用なら 30日無料試用を適用
  const { data: referral } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_salon_id", salon.id)
    .is("referred_reward_applied_at", null)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/billing`,
    client_reference_id: salon.id,
    metadata: {
      salon_id: salon.id,
      user_id: user.id,
      referral_id: referral?.id ?? "",
    },
    // customer と customer_email は排他。既存顧客があれば必ず再利用する
    ...(customerId ? { customer: customerId } : { customer_email: user.email }),
    ...(referral
      ? {
          subscription_data: {
            trial_period_days: 30,
            metadata: {
              salon_id: salon.id,
              referral_id: referral.id,
            },
          },
        }
      : {}),
  });

  return NextResponse.json({ url: session.url });
}

/**
 * Stripe 側で契約中なのに DB が追いついていない状態を復旧する。
 * Webhook が失敗したまま放置されると「課金済みなのにおためしプラン」が固定されるため、
 * ユーザーがアップグレードを試みたこのタイミングで実態に合わせる。
 */
async function syncSubscriptionState(
  salonId: string,
  customerId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const admin = createAdminClient();
  const periodEnd = subscription.items.data[0]?.current_period_end;

  const { error: subError } = await admin.from("subscriptions").upsert(
    {
      salon_id: salonId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status === "past_due" ? "past_due" : "active",
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    },
    { onConflict: "salon_id" }
  );

  const { error: planError } = await admin
    .from("salons")
    .update({ plan_type: "standard" })
    .eq("id", salonId);

  if (subError || planError) {
    console.error("契約状態の復旧に失敗:", subError ?? planError);
    Sentry.captureException(subError ?? planError, {
      tags: { feature: "stripe-checkout", severity: "billing" },
      extra: { salon_id: salonId, customer_id: customerId },
    });
    return;
  }

  console.log(
    `契約状態を復旧: salon=${salonId} subscription=${subscription.id}`
  );
}
