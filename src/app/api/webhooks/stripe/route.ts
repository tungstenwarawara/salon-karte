import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOperatorBillingEvent } from "@/lib/email/operator-notify";
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

  if (idempotencyError && idempotencyError.code === "23505") {
    // unique violation = 既に処理済み → 200を返して終了
    return NextResponse.json({ received: true, duplicate: true });
  }

  // マーカーを書けなかった場合（テーブルアクセスエラー等）は処理を続行する。
  // 失敗時にロールバックすべきマーカーが無いことを覚えておく
  const markerStored = !idempotencyError;
  if (idempotencyError) {
    console.error("冪等性チェックエラー:", idempotencyError);
    Sentry.captureException(idempotencyError, {
      tags: { feature: "stripe-webhook" },
      extra: { event_id: event.id, event_type: event.type },
    });
  }

  try {
    await handleStripeEvent(event, supabase);
  } catch (err) {
    console.error(`Stripe Webhook 処理失敗 (${event.type} / ${event.id}):`, err);
    Sentry.captureException(err, {
      tags: { feature: "stripe-webhook" },
      extra: { event_id: event.id, event_type: event.type },
    });

    // 冪等性マーカーを取り消す。
    // 残したままにすると Stripe の再送が「処理済み」として弾かれ、
    // 「課金されたのに plan_type が free のまま」という状態が永久に固定される
    if (markerStored) {
      const { error: rollbackError } = await supabase
        .from("stripe_processed_events")
        .delete()
        .eq("event_id", event.id);

      if (rollbackError) {
        console.error("冪等性マーカーの取り消しに失敗:", rollbackError);
        Sentry.captureException(rollbackError, {
          tags: { feature: "stripe-webhook" },
          extra: { event_id: event.id, event_type: event.type },
        });
      }
    }

    // 500 を返して Stripe に再送させる（Stripe は最大3日間リトライする）
    return NextResponse.json({ error: "処理に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Stripe イベントを処理する。
 *
 * **重要**: DB 更新に失敗したら必ず throw すること。
 * 握りつぶして 200 を返すと Stripe は再送せず、課金と実態のズレが恒久化する。
 */
async function handleStripeEvent(
  event: Stripe.Event,
  supabase: SupabaseClient
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const salonId = session.metadata?.salon_id;
      if (!salonId || !session.customer || !session.subscription) return;

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

      // 二重契約の検知:
      // 既に別のサブスクリプションが有効なまま2本目が成約した場合、
      // upsert で上書きすると旧サブスクが追跡不能のまま課金され続ける。
      // 自動キャンセルは誤爆時の被害が大きいため、記録だけ残して人間の判断に委ねる
      const { data: existing, error: existingError } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id, status")
        .eq("salon_id", salonId)
        .maybeSingle();

      if (existingError) {
        throw new Error(`既存サブスクの確認に失敗: ${existingError.message}`);
      }

      if (
        existing &&
        existing.status === "active" &&
        existing.stripe_subscription_id !== subscriptionId
      ) {
        const message =
          `二重サブスクリプション検知: salon=${salonId} ` +
          `既存=${existing.stripe_subscription_id} 新規=${subscriptionId}`;
        console.error(message);
        Sentry.captureException(new Error(message), {
          tags: { feature: "stripe-webhook", severity: "billing" },
          extra: {
            salon_id: salonId,
            existing_subscription_id: existing.stripe_subscription_id,
            new_subscription_id: subscriptionId,
          },
        });
      }

      // subscriptions テーブルに UPSERT
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
            // 再契約のとき、前回の解約予定が残らないよう明示的に戻す
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          },
          { onConflict: "salon_id" }
        );

      if (insertError) {
        throw new Error(`subscriptions の upsert に失敗: ${insertError.message}`);
      }

      // salon の plan_type を standard に更新（通知用にサロン名も受け取る）
      const { data: updatedSalon, error: updateError } = await supabase
        .from("salons")
        .update({ plan_type: "standard" })
        .eq("id", salonId)
        .select("name")
        .maybeSingle();

      if (updateError) {
        throw new Error(
          `salons.plan_type の更新に失敗: ${updateError.message}`
        );
      }

      // 紹介特典（被紹介者側）: trial 付きチェックアウトなら referred_reward_applied_at を記録
      const referralId = session.metadata?.referral_id;
      if (referralId && sub.trial_end) {
        const { error: refError } = await supabase
          .from("referrals")
          .update({ referred_reward_applied_at: new Date().toISOString() })
          .eq("id", referralId);

        if (refError) {
          throw new Error(`referrals の被紹介特典更新に失敗: ${refError.message}`);
        }
      }

      // DB更新がすべて成功してから通知する（途中で呼ぶと再送時に重複する）
      notifyOperatorBillingEvent({
        kind: "subscribed",
        salonName: updatedSalon?.name ?? null,
        salonId,
        occurredAt: eventTimestamp(event),
      });
      return;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      const status = mapStripeStatus(sub.status);
      const itemPeriodEnd = sub.items.data[0]?.current_period_end;
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status,
          // 期間末解約の予約・取り消しはこのイベントで届く。
          // status は active のままなので、これを保持しないと
          // 解約手続き済みかどうかを画面で区別できない
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          ...(itemPeriodEnd
            ? {
                current_period_end: new Date(
                  itemPeriodEnd * 1000
                ).toISOString(),
              }
            : {}),
        })
        .eq("stripe_customer_id", customerId);

      if (error) {
        throw new Error(`subscriptions の更新に失敗: ${error.message}`);
      }
      return;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      // サブスクリプションを canceled に
      const { data: subscription, error: cancelError } = await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_customer_id", customerId)
        .select("salon_id")
        .maybeSingle();

      if (cancelError) {
        throw new Error(
          `subscriptions のキャンセル更新に失敗: ${cancelError.message}`
        );
      }

      // 該当行なし（テストモード時代の顧客等）は何もしない
      if (!subscription) return;

      // salon の plan_type を free に戻す（通知用にサロン名も受け取る）
      const { data: downgradedSalon, error: planError } = await supabase
        .from("salons")
        .update({ plan_type: "free" })
        .eq("id", subscription.salon_id)
        .select("name")
        .maybeSingle();

      if (planError) {
        throw new Error(
          `salons.plan_type の free 戻しに失敗: ${planError.message}`
        );
      }

      notifyOperatorBillingEvent({
        kind: "canceled",
        salonName: downgradedSalon?.name ?? null,
        salonId: subscription.salon_id,
        occurredAt: eventTimestamp(event),
      });
      return;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (!customerId) return;

      const { data: pastDueSub, error } = await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_customer_id", customerId)
        .select("salon_id")
        .maybeSingle();

      if (error) {
        throw new Error(`past_due への更新に失敗: ${error.message}`);
      }

      if (pastDueSub) {
        notifyOperatorBillingEvent({
          kind: "payment_failed",
          salonName: await lookupSalonName(supabase, pastDueSub.salon_id),
          salonId: pastDueSub.salon_id,
          occurredAt: eventTimestamp(event),
        });
      }
      return;
    }

    case "invoice.paid": {
      // 被紹介者の初回有料請求（trial 終了後）が完了したら、紹介者に 2,980円分のクレジットを付与
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.amount_paid <= 0 || !invoice.customer) return;

      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer.id;

      // 1. この customer が「被紹介側」で紹介者特典がまだ未付与の referrals を探す
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("salon_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (subError) {
        throw new Error(`subscriptions の取得に失敗: ${subError.message}`);
      }
      if (!subscription) return;

      const { data: referral, error: referralError } = await supabase
        .from("referrals")
        .select("id, referrer_salon_id")
        .eq("referred_salon_id", subscription.salon_id)
        .is("referrer_reward_applied_at", null)
        .maybeSingle();

      if (referralError) {
        throw new Error(`referrals の取得に失敗: ${referralError.message}`);
      }
      if (!referral) return;

      // 2. 紹介者側にクレジットを付与
      await applyReferrerReward(supabase, referral);
      return;
    }
  }
}

/**
 * 紹介者側に 1ヶ月分（2,980円）のクレジットを付与し referrals を更新
 *
 * **この関数は throw しない。**
 * Stripe の残高クレジット付与（createBalanceTransaction）は冪等でないため、
 * throw して Webhook を再送させるとクレジットが二重付与される。
 * 失敗は記録に留め、次回の invoice.paid で再試行させる。
 */
async function applyReferrerReward(
  supabase: SupabaseClient,
  referral: { id: string; referrer_salon_id: string }
) {
  // 紹介者のサブスク情報を取得
  const { data: referrerSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("salon_id", referral.referrer_salon_id)
    .maybeSingle();

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
    Sentry.captureException(err, {
      tags: { feature: "stripe-webhook" },
      extra: { referral_id: referral.id },
    });
    return;
  }

  // referrals テーブルを更新（両者適用済みなら status=rewarded）
  const now = new Date().toISOString();
  const { data: current } = await supabase
    .from("referrals")
    .select("referred_reward_applied_at")
    .eq("id", referral.id)
    .maybeSingle();

  const bothApplied = !!current?.referred_reward_applied_at;
  const { error: updateError } = await supabase
    .from("referrals")
    .update({
      referrer_reward_applied_at: now,
      ...(bothApplied ? { status: "rewarded" } : {}),
    })
    .eq("id", referral.id);

  // ここで失敗するとクレジットは付与済みなのに未適用扱いのまま残り、
  // 翌月の invoice.paid で二重付与される。throw はできないので必ず気付けるようにする
  if (updateError) {
    console.error("紹介特典の適用記録に失敗（二重付与のおそれ）:", updateError);
    Sentry.captureException(updateError, {
      tags: { feature: "stripe-webhook", severity: "billing" },
      extra: { referral_id: referral.id },
    });
  }
}

/**
 * 通知に載せるサロン名を引く。
 * 表示用の情報でしかないため、失敗しても null を返して処理を止めない。
 */
async function lookupSalonName(
  supabase: SupabaseClient,
  salonId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("salons")
    .select("name")
    .eq("id", salonId)
    .maybeSingle();

  if (error) {
    console.error("通知用のサロン名取得に失敗:", error);
    return null;
  }
  return data?.name ?? null;
}

/**
 * イベント発生時刻を ISO 文字列で返す。
 *
 * event.created は Stripe が必ず付与するが、欠けていた場合に
 * new Date(NaN).toISOString() が throw すると、通知のためだけに
 * 課金反映まで失敗して再送ループに入る。現在時刻でフォールバックする。
 */
function eventTimestamp(event: Stripe.Event): string {
  const created = event.created;
  if (typeof created !== "number" || !Number.isFinite(created)) {
    return new Date().toISOString();
  }
  return new Date(created * 1000).toISOString();
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
