import { PLAN_LIMITS, getPlanLabel, type PlanType } from "@/lib/plan";

type Props = {
  planType: PlanType;
  subscriptionStatus: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  actionLoading: boolean;
  onManage: () => void;
  /**
   * 運営が手動でスタンダードを付与した状態（Stripe 契約なしで全機能利用中）。
   * Stripe に顧客が存在しないため「プラン管理」は開けない。
   * 代わりに支払い開始の導線を出す
   */
  specialGrant?: boolean;
  onStartPayment?: () => void;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/** 現在のプラン・次回請求日・支払い方法の管理ボタン */
export function BillingPlanStatus({
  planType,
  subscriptionStatus,
  periodEnd,
  cancelAtPeriodEnd,
  actionLoading,
  onManage,
  specialGrant = false,
  onStartPayment,
}: Props) {
  const endingSoon = planType === "standard" && cancelAtPeriodEnd;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            planType === "standard" ? "bg-accent" : "bg-text-light"
          }`}
        />
        <p className="text-sm text-text-light">現在のプラン</p>
      </div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <p className="text-2xl font-bold">{getPlanLabel(planType)}</p>
        <p className="text-base font-bold text-text-light">
          ¥
          {specialGrant
            ? 0
            : PLAN_LIMITS[planType].monthlyPriceJpy.toLocaleString()}
          <span className="text-xs font-normal"> / 月</span>
        </p>
      </div>

      {planType === "standard" && subscriptionStatus === "past_due" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <p className="text-sm text-yellow-800 font-medium">
            お支払いに問題があります。カード情報をご確認ください。
          </p>
        </div>
      )}
      {/* 解約手続き済み。status は active のままなので、
          これを出さないと「解約できたのか分からない」状態になる */}
      {endingSoon && periodEnd && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-1">
          <p className="text-sm text-yellow-900 font-medium">
            解約のお手続きが完了しています
          </p>
          <p className="text-sm text-yellow-900">
            {formatDate(periodEnd)}まではすべての機能をご利用いただけます。
            以降の請求はありません。
          </p>
          <p className="text-sm text-yellow-900">
            続けてご利用になる場合は、下のボタンから解約を取り消せます。
          </p>
        </div>
      )}

      {planType === "standard" && periodEnd && !endingSoon && (
        <p className="text-sm text-text-light">
          次回請求日: {formatDate(periodEnd)}
        </p>
      )}

      {/* 手動付与でご利用中のサロン。
          Stripe に契約が無いため「プラン管理」は開けない（開くとエラーになる）。
          支払いを開始する導線だけを出す */}
      {specialGrant && (
        <div className="space-y-3">
          <div className="bg-accent/10 border border-accent rounded-xl p-3 space-y-1">
            <p className="text-sm font-bold text-accent">
              現在は無料でご利用いただいています
            </p>
            <p className="text-sm text-text-light">
              スタンダードプランの全機能を、お支払いなしでお使いいただいている状態です。
            </p>
            <p className="text-sm text-text-light">
              お支払いを開始すると、月額¥
              {PLAN_LIMITS.standard.monthlyPriceJpy.toLocaleString()}
              （税込）の課金が始まります。
              <span className="font-medium">
                今お使いの機能・データはそのまま引き継がれます。
              </span>
            </p>
          </div>
          <button
            onClick={onStartPayment}
            disabled={actionLoading}
            className="w-full bg-accent hover:bg-accent-light text-white font-bold rounded-2xl py-4 text-center transition-colors disabled:opacity-50 min-h-[56px]"
          >
            {actionLoading ? "読み込み中..." : "お支払いを開始する"}
          </button>
        </div>
      )}

      {planType === "standard" && !specialGrant && (
        <button
          onClick={onManage}
          disabled={actionLoading}
          className="w-full bg-background border border-border text-text font-medium rounded-2xl py-4 text-center transition-colors hover:bg-surface disabled:opacity-50 min-h-[56px]"
        >
          {actionLoading
            ? "読み込み中..."
            : endingSoon
              ? "解約を取り消す・支払い方法を管理"
              : "プラン・支払い方法を管理"}
        </button>
      )}
    </div>
  );
}
