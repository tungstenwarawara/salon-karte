import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

const REFERRER_REWARD_AMOUNT_JPY = 2980;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "署名がありません" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET が未設定");
    return NextResponse.json({ error: "設定エラー" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook署名検証失敗:", err);
    return NextResponse.json({ error: "署名検証失敗" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 冪等性チェック: 同じイベントが再送されても二重処理しない
  const { error: idempotencyError } = await supabase
    .from("stripe_processed_events")
    .insert({ event_id: event.id, event_type: event.type });

  if (idempotencyError) {
    // unique violation = 既に処理済み → 200を返して終了
    if (idempotencyError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("冪等性チェックエラー:", idempotencyError);
    // テーブルアクセスエラーでも処理は続行（安全側に倒す）
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const salonId = session.metadata?.salon_id;
      if (!salonId || !session.customer || !session.subscription) break;

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

      // サブスクリプション詳細を取得（items展開で current_period_end を取得）
      const sub = await getStripe().subscriptions.retrieve(subscriptionId, {
        expand: ["items.data"],
      });
      const periodEnd = sub.items.data[0]?.current_period_end;

      // subscriptions テーブルに INSERT
      const { error: insertError } = await supabase
        .from("subscriptions")
        .upsert(
          {
            salon_id: salonId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: "active",
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          },
          { onConflict: "salon_id" }
        );

      if (insertError) {
        console.error("subscription insert エラー:", insertError);
        break;
      }

      // salon の plan_type を standard に更新
      const { error: updateError } = await supabase
        .from("salons")
        .update({ plan_type: "standard" })
        .eq("id", salonId);

      if (updateError) {
        console.error("salon plan_type update エラー:", updateError);
      }

      // 紹介特典（被紹介者側）: trial 付きチェックアウトなら referred_reward_applied_at を記録
      const referralId = session.metadata?.referral_id;
      if (referralId && sub.trial_end) {
        const { error: refError } = await supabase
          .from("referrals")
          .update({ referred_reward_applied_at: new Date().toISOString() })
          .eq("id", referralId);
        if (refError) {
          console.error("referrals 被紹介特典更新エラー:", refError);
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      const status = mapStripeStatus(sub.status);
      const itemPeriodEnd = sub.items.data[0]?.current_period_end;
      await supabase
        .from("subscriptions")
        .update({
          status,
          ...(itemPeriodEnd
            ? {
                current_period_end: new Date(
                  itemPeriodEnd * 1000
                ).toISOString(),
              }
            : {}),
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      // サブスクリプションを canceled に
      const { data: subscription } = await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_customer_id", customerId)
        .select("salon_id")
        .single();

      // salon の plan_type を free に戻す
      if (subscription) {
        await supabase
          .from("salons")
          .update({ plan_type: "free" })
          .eq("id", subscription.salon_id);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (customerId) {
        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }

    case "invoice.paid": {
      // 被紹介者の初回有料請求（trial 終了後）が完了したら、紹介者に 2,980円分のクレジットを付与
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.amount_paid <= 0 || !invoice.customer) break;

      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer.id;

      // 1. この customer が「被紹介側」で紹介者特典がまだ未付与の referrals を探す
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("salon_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!subscription) break;

      const { data: referral } = await supabase
        .from("referrals")
        .select("id, referrer_salon_id")
        .eq("referred_salon_id", subscription.salon_id)
        .is("referrer_reward_applied_at", null)
        .maybeSingle();

      if (!referral) break;

      // 2. 紹介者側のサブスク情報を取得
      await applyReferrerReward(supabase, referral);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

/** 紹介者側に 1ヶ月分（2,980円）のクレジットを付与し referrals を更新 */
async function applyReferrerReward(
  supabase: SupabaseClient,
  referral: { id: string; referrer_salon_id: string }
) {
  // 紹介者のサブスク情報を取得
  const { data: referrerSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("salon_id", referral.referrer_salon_id)
    .single();

  // 紹介者がまだ有料プラン未加入の場合は後で（salon側が checkout するとき）適用するため今回はスキップ
  // referrer_reward_applied_at は更新しないので、次回 invoice.paid で再チェックされる
  if (!referrerSub?.stripe_customer_id) {
    console.log(`紹介者(${referral.referrer_salon_id})は未課金のため特典を保留`);
    return;
  }

  try {
    // Stripe Customer Balance に -2,980 JPY のクレジットを付与（次回請求から自動控除）
    await getStripe().customers.createBalanceTransaction(
      referrerSub.stripe_customer_id,
      {
        amount: -REFERRER_REWARD_AMOUNT_JPY,
        currency: "jpy",
        description: `紹介特典: 1ヶ月無料分クレジット (referral_id=${referral.id})`,
      }
    );
  } catch (err) {
    console.error("紹介者クレジット付与エラー:", err);
    return;
  }

  // referrals テーブルを更新（両者適用済みなら status=rewarded）
  const now = new Date().toISOString();
  const { data: current } = await supabase
    .from("referrals")
    .select("referred_reward_applied_at")
    .eq("id", referral.id)
    .single();

  const bothApplied = !!current?.referred_reward_applied_at;
  await supabase
    .from("referrals")
    .update({
      referrer_reward_applied_at: now,
      ...(bothApplied ? { status: "rewarded" } : {}),
    })
    .eq("id", referral.id);
}

/** Stripe のステータスをアプリ内ステータスにマッピング */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): "active" | "past_due" | "canceled" | "incomplete" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    default:
      return "incomplete";
  }
}
