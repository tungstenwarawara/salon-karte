import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook署名検証失敗:", err);
    return NextResponse.json({ error: "署名検証失敗" }, { status: 400 });
  }

  const supabase = createAdminClient();

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
      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
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
  }

  return NextResponse.json({ received: true });
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
