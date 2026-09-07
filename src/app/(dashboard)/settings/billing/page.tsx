"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBillingStatus, isPaymentReflected } from "@/lib/hooks/use-billing-status";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { UsageBar, LockedFeatureRow } from "@/components/plan/usage-bar";
import { BillingPlanStatus } from "@/components/billing/billing-plan-status";
import { BillingPlanComparison } from "@/components/billing/billing-plan-comparison";
import { BillingSyncNotice } from "@/components/billing/billing-sync-notice";
import { BillingFaq } from "@/components/billing/billing-faq";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const justCheckedOut = searchParams.get("success") === "true";
  const { toast, showToast, hideToast } = useToast();
  const {
    planType,
    periodEnd,
    subscriptionStatus,
    cancelAtPeriodEnd,
    usage,
    hasReferralBenefit,
    loading,
    syncing,
    syncTimedOut,
  } = useBillingStatus(justCheckedOut);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // 反映が確認できてから完了を伝える（反映前に出すと「反映中」と矛盾する）。
  // 手動付与のサロンは決済前から standard なので、契約の反映で判定する
  useEffect(() => {
    if (justCheckedOut && isPaymentReflected(subscriptionStatus)) {
      showToast("スタンダードプランのお支払い登録が完了しました");
    }
  }, [justCheckedOut, subscriptionStatus, showToast]);

  const handleUpgrade = async () => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "エラーが発生しました");
        setActionLoading(false);
      }
    } catch (err) {
      console.error("Checkout エラー:", err);
      setError("通信エラーが発生しました");
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "エラーが発生しました");
        setActionLoading(false);
      }
    } catch (err) {
      console.error("Portal エラー:", err);
      setError("通信エラーが発生しました");
      setActionLoading(false);
    }
  };

  const header = (
    <PageHeader
      title="料金プラン"
      breadcrumbs={[{ label: "設定", href: "/settings" }, { label: "料金プラン" }]}
    />
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {header}
        <div className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-border/50 rounded w-1/3 mb-4" />
          <div className="h-10 bg-border/50 rounded w-1/2 mb-4" />
          <div className="h-12 bg-border/50 rounded w-full" />
        </div>
      </div>
    );
  }

  // 決済直後の反映待ち: フリープランのUIを見せない
  // （支払い済みの画面に「アップグレード」ボタンを出すと二重契約を誘発する）
  if (syncing) {
    return (
      <div className="space-y-4">
        {header}
        <BillingSyncNotice timedOut={false} />
      </div>
    );
  }

  // 支払いが DB に反映済みか（plan_type ではなく契約実態で見る）
  const paymentReflected = isPaymentReflected(subscriptionStatus);

  // 決済したのに反映されていない状態。
  // 「おためしプラン ¥0/月」を出すと支払い済みのお客様が
  // 「課金されていない」と誤解するため、プラン状態そのものを表示しない
  const planUnconfirmed = syncTimedOut && !paymentReflected;
  const showFreePlanSections = planType === "free" && !syncTimedOut;

  // 運営が手動でスタンダードを付与したサロン（Stripe 契約が存在しない）。
  // 全機能を無料で使えている状態で、支払いを始める導線がここにしかない。
  // Webhook は subscriptions を先に書いてから plan_type を standard にするので、
  // 決済経由でこの状態になることはない
  const specialGrant = planType === "standard" && !paymentReflected;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      {header}

      {error && <ErrorAlert message={error} />}

      {/* 反映されないまま待ち時間を超えた場合の案内 */}
      {planUnconfirmed && <BillingSyncNotice timedOut />}

      {/* 現在のプラン状態 */}
      {!planUnconfirmed && (
        <BillingPlanStatus
          planType={planType}
          subscriptionStatus={subscriptionStatus}
          periodEnd={periodEnd}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          actionLoading={actionLoading}
          onManage={handleManage}
          specialGrant={specialGrant}
          onStartPayment={handleUpgrade}
        />
      )}

      {/* 紹介特典バナー（被紹介者・Free のみ） */}
      {showFreePlanSections && hasReferralBenefit && (
        <div className="bg-accent/10 border-2 border-accent rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl leading-none">🎁</span>
          <div className="flex-1">
            <p className="font-bold text-accent">紹介特典が適用されます</p>
            <p className="text-sm text-text-light mt-1">
              アップグレードすると<span className="font-bold">最初の30日間が無料</span>になります。
              31日目から月額¥2,980の課金が始まります。
            </p>
          </div>
        </div>
      )}

      {/* 使用状況（フリープランのみ） */}
      {showFreePlanSections && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold">📊 現在の使用状況</h3>
          <div className="space-y-3">
            <UsageBar label="顧客" type="customers" current={usage.customers} planType={planType} unit="人" />
            <UsageBar label="カルテ" type="records" current={usage.records} planType={planType} unit="件" />
            <UsageBar label="予約（今月）" type="appointmentsThisMonth" current={usage.appointmentsThisMonth} planType={planType} unit="件" />
            <LockedFeatureRow label="施術写真" />
            <LockedFeatureRow label="LINE連携" />
            <LockedFeatureRow label="カウンセリングシート" />
            <LockedFeatureRow label="売上分析" />
          </div>
        </div>
      )}

      {/* プラン比較 + アップグレードCTA */}
      {showFreePlanSections && (
        <BillingPlanComparison
          hasReferralBenefit={hasReferralBenefit}
          actionLoading={actionLoading}
          onUpgrade={handleUpgrade}
        />
      )}

      {/* 切替タイミングの説明 */}
      {showFreePlanSections && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
          <h3 className="font-bold">💡 アップグレードの流れ</h3>
          <ol className="text-sm text-text-light space-y-2 list-decimal list-inside">
            <li>「スタンダードにアップグレード」ボタンを押す</li>
            <li>カード情報を登録（Stripeの安全な決済画面）</li>
            <li>その瞬間からスタンダードプランに切替・全機能利用可能</li>
            <li>{hasReferralBenefit ? "31日目から" : "即日"}月額¥2,980（税込）の課金が始まります</li>
            <li>解約は「プラン管理」からいつでも可能（解約後も期間末まで利用可）</li>
          </ol>
        </div>
      )}

      {/* FAQ */}
      <BillingFaq />
    </div>
  );
}
