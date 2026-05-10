"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import {
  PLAN_LIMITS,
  getPlanLabel,
  type PlanType,
} from "@/lib/plan";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { UsageBar, LockedFeatureRow } from "@/components/plan/usage-bar";
import { BillingPlanComparison } from "@/components/billing/billing-plan-comparison";
import { BillingFaq } from "@/components/billing/billing-faq";

type Usage = {
  customers: number;
  records: number;
  appointmentsThisMonth: number;
};

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const [planType, setPlanType] = useState<PlanType>("free");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage>({
    customers: 0,
    records: 0,
    appointmentsThisMonth: 0,
  });
  const [hasReferralBenefit, setHasReferralBenefit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      showToast("スタンダードプランへのアップグレードが完了しました");
    }
  }, [searchParams, showToast]);

  useEffect(() => {
    const load = async () => {
      const { salonId } = await getClientAuth();
      if (!salonId) return;

      const supabase = createClient();

      // 今月の予約範囲
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const startOfNextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

      const [salonRes, subRes, customersRes, recordsRes, appointmentsRes, referralRes] =
        await Promise.all([
          supabase.from("salons").select("plan_type").eq("id", salonId).single(),
          supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("salon_id", salonId)
            .maybeSingle(),
          supabase
            .from("customers")
            .select("id", { count: "exact", head: true })
            .eq("salon_id", salonId),
          supabase
            .from("treatment_records")
            .select("id", { count: "exact", head: true })
            .eq("salon_id", salonId),
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("salon_id", salonId)
            .gte("appointment_date", startOfMonth)
            .lt("appointment_date", startOfNextMonth),
          supabase
            .from("referrals")
            .select("id")
            .eq("referred_salon_id", salonId)
            .is("referred_reward_applied_at", null)
            .maybeSingle(),
        ]);

      if (salonRes.data) setPlanType(salonRes.data.plan_type as PlanType);
      if (subRes.data) {
        setSubscriptionStatus(subRes.data.status);
        setPeriodEnd(subRes.data.current_period_end);
      }
      setUsage({
        customers: customersRes.count ?? 0,
        records: recordsRes.count ?? 0,
        appointmentsThisMonth: appointmentsRes.count ?? 0,
      });
      setHasReferralBenefit(!!referralRes.data);
      setLoading(false);
    };
    load();
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="料金プラン" breadcrumbs={[{ label: "設定", href: "/settings" }, { label: "料金プラン" }]} />
        <div className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-border/50 rounded w-1/3 mb-4" />
          <div className="h-10 bg-border/50 rounded w-1/2 mb-4" />
          <div className="h-12 bg-border/50 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="料金プラン" breadcrumbs={[{ label: "設定", href: "/settings" }, { label: "料金プラン" }]} />

      {error && <ErrorAlert message={error} />}

      {/* 現在のプラン状態 */}
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
            ¥{PLAN_LIMITS[planType].monthlyPriceJpy.toLocaleString()}
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
        {planType === "standard" && periodEnd && (
          <p className="text-sm text-text-light">
            次回請求日: {new Date(periodEnd).toLocaleDateString("ja-JP")}
          </p>
        )}

        {planType === "standard" && (
          <button
            onClick={handleManage}
            disabled={actionLoading}
            className="w-full bg-background border border-border text-text font-medium rounded-2xl py-4 text-center transition-colors hover:bg-surface disabled:opacity-50 min-h-[56px]"
          >
            {actionLoading ? "読み込み中..." : "プラン・支払い方法を管理"}
          </button>
        )}
      </div>

      {/* 紹介特典バナー（被紹介者・Free のみ） */}
      {planType === "free" && hasReferralBenefit && (
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
      {planType === "free" && (
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
      {planType === "free" && (
        <BillingPlanComparison
          hasReferralBenefit={hasReferralBenefit}
          actionLoading={actionLoading}
          onUpgrade={handleUpgrade}
        />
      )}

      {/* 切替タイミングの説明 */}
      {planType === "free" && (
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
