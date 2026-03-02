import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

export async function POST() {
  const { user, salon } = await getAuthAndSalon();

  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  if (salon.plan_type === "standard") {
    return NextResponse.json(
      { error: "すでにスタンダードプランです" },
      { status: 400 }
    );
  }

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "料金設定が見つかりません" },
      { status: 500 }
    );
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/settings/billing`,
    metadata: {
      salon_id: salon.id,
      user_id: user.id,
    },
    customer_email: user.email,
  });

  return NextResponse.json({ url: session.url });
}
