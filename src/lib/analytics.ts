/**
 * GA4 カスタムイベント送信ユーティリティ
 *
 * 集客ファネル計測用。GA4が読み込まれていない場合は何もしない（安全）。
 */

// gtag のグローバル型宣言
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type AcquisitionEvent =
  | { name: "cta_click"; params: { location: string; label: string } }
  | { name: "sign_up_start" }
  | { name: "sign_up_form_submit" }
  | { name: "sign_up_completed"; params: { method: "email" } }
  | { name: "email_confirmed" }
  | { name: "onboarding_complete" }
  | { name: "first_record" }
  | { name: "blog_read"; params: { slug: string; title: string } }
  | { name: "simulator_complete"; params: {
      daily_customers: number; avg_price: number; working_days: number;
      current_cost: number; tools: string; annual_savings: number;
    } };

/**
 * GA4 カスタムイベントを送信する。
 * GA4 が未読み込み（Cookie 拒否時やテスト環境）なら何もしない。
 */
export function trackEvent(event: AcquisitionEvent): void {
  if (typeof window === "undefined" || !window.gtag) return;

  const { name, ...rest } = event;
  const params = "params" in rest ? rest.params : undefined;
  window.gtag("event", name, params);
}
