import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

export async function POST() {
  const { user, salon, supabase } = await getAuthAndSalon();

  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("salon_id", salon.id)
    .single();

  if (!subscription) {
    return NextResponse.json(
      { error: "サブスクリプションが見つかりません" },
      { status: 404 }
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
