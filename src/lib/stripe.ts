import Stripe from "stripe";

// 遅延初期化: next build 時にはAPIルートのインポートだけで
// STRIPE_SECRET_KEY が未設定でもビルドが通るようにする
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY が設定されていません");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}
