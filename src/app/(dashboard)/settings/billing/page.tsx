"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { getPlanLabel } from "@/lib/plan";
import type { PlanType } from "@/lib/plan";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const [planType, setPlanType] = useState<PlanType>("free");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
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
      const [salonRes, subRes] = await Promise.all([
        supabase
          .from("salons")
          .select("plan_type")
          .eq("id", salonId)
          .single(),
        supabase
          .from("subscriptions")
          .select("status, current_period_end")
          .eq("salon_id", salonId)
          .maybeSingle(),
      ]);

      if (salonRes.data) {
        setPlanType(salonRes.data.plan_type as PlanType);
      }
      if (subRes.data) {
        setSubscriptionStatus(subRes.data.status);
        setPeriodEnd(subRes.data.current_period_end);
      }
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

      {/* 現在のプラン */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-sm text-text-light mb-1">現在のプラン</p>
          <p className="text-xl font-bold">{getPlanLabel(planType)}</p>
        </div>

        {planType === "standard" && (
          <>
            {subscriptionStatus === "past_due" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  お支払いに問題があります。カード情報をご確認ください。
                </p>
              </div>
            )}
            {periodEnd && (
              <p className="text-sm text-text-light">
                次回請求日: {new Date(periodEnd).toLocaleDateString("ja-JP")}
              </p>
            )}
            <button
              onClick={handleManage}
              disabled={actionLoading}
              className="w-full bg-surface border border-border text-text font-medium rounded-2xl py-4 text-center transition-colors hover:bg-background disabled:opacity-50 min-h-[56px]"
            >
              {actionLoading ? "読み込み中..." : "プラン・支払い方法を管理"}
            </button>
          </>
        )}

        {planType === "free" && (
          <>
            <div className="bg-accent/5 rounded-xl p-4 space-y-2">
              <p className="font-bold text-accent">スタンダードプラン</p>
              <p className="text-2xl font-bold">
                2,980<span className="text-sm font-normal text-text-light">円/月（税込）</span>
              </p>
              <ul className="text-sm text-text-light space-y-1">
                <li>顧客数・カルテ枚数 無制限</li>
                <li>写真保存・LINE連携・売上分析</li>
                <li>初期費用0円・いつでも解約OK</li>
              </ul>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={actionLoading}
              className="w-full bg-accent hover:bg-accent-light text-white font-bold rounded-2xl py-4 text-center text-lg transition-colors disabled:opacity-50 min-h-[56px]"
            >
              {actionLoading ? "読み込み中..." : "スタンダードにアップグレード"}
            </button>
          </>
        )}
      </div>

      {/* おためしプランの制限説明 */}
      {planType === "free" && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-sm text-text-light">おためしプランの目安</h3>
          <ul className="text-sm text-text-light space-y-1.5">
            <li>顧客 50人まで</li>
            <li>カルテ 100件まで</li>
            <li>予約 月30件まで</li>
            <li>写真保存・LINE連携・カウンセリングシート・売上分析は含まれません</li>
          </ul>
        </div>
      )}
    </div>
  );
}
