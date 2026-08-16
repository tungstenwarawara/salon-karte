"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import type { PlanType } from "@/lib/plan";

export type BillingUsage = {
  customers: number;
  records: number;
  appointmentsThisMonth: number;
};

export type BillingStatus = {
  planType: PlanType;
  periodEnd: string | null;
  subscriptionStatus: string | null;
  /** 期間末で解約予定か（Stripe Portal で解約手続き済み） */
  cancelAtPeriodEnd: boolean;
  usage: BillingUsage;
  hasReferralBenefit: boolean;
  loading: boolean;
  /** 決済は完了したが Webhook の反映待ち */
  syncing: boolean;
  /** 待っても反映されなかった（Webhook 失敗の可能性） */
  syncTimedOut: boolean;
};

/**
 * 決済完了後の反映待ちポーリング設定。
 *
 * Stripe は決済直後に success_url へリダイレクトするが、plan_type が standard に
 * なるのは Webhook 受信後。1回だけ読むと「支払ったのにおためしプラン」と
 * 表示されうるため、反映されるまで待つ。
 */
const SYNC_POLL_INTERVAL_MS = 2000;
const SYNC_MAX_ATTEMPTS = 10; // 最大20秒

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 料金プラン画面の表示に必要な状態をまとめて取得する。
 *
 * @param justCheckedOut Stripe の決済完了直後（success=true）か
 */
export function useBillingStatus(justCheckedOut: boolean): BillingStatus {
  const [planType, setPlanType] = useState<PlanType>("free");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null
  );
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [usage, setUsage] = useState<BillingUsage>({
    customers: 0,
    records: 0,
    appointmentsThisMonth: 0,
  });
  const [hasReferralBenefit, setHasReferralBenefit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(justCheckedOut);
  const [syncTimedOut, setSyncTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    /** プラン状態のみを取り直す（ポーリング用の軽量クエリ） */
    const fetchPlanState = async (salonId: string) => {
      const [salonRes, subRes] = await Promise.all([
        supabase.from("salons").select("plan_type").eq("id", salonId).single(),
        supabase
          .from("subscriptions")
          .select("status, current_period_end, cancel_at_period_end")
          .eq("salon_id", salonId)
          .maybeSingle(),
      ]);
      return {
        planType: (salonRes.data?.plan_type ?? "free") as PlanType,
        status: subRes.data?.status ?? null,
        periodEnd: subRes.data?.current_period_end ?? null,
        cancelAtPeriodEnd: subRes.data?.cancel_at_period_end ?? false,
      };
    };

    const load = async () => {
      const { salonId } = await getClientAuth();
      if (!salonId || cancelled) return;

      // 今月の予約範囲
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const startOfNextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

      const [
        salonRes,
        subRes,
        customersRes,
        recordsRes,
        appointmentsRes,
        referralRes,
      ] = await Promise.all([
        supabase.from("salons").select("plan_type").eq("id", salonId).single(),
        supabase
          .from("subscriptions")
          .select("status, current_period_end, cancel_at_period_end")
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

      if (cancelled) return;

      const currentPlan = (salonRes.data?.plan_type ?? "free") as PlanType;
      setPlanType(currentPlan);
      if (subRes.data) {
        setSubscriptionStatus(subRes.data.status);
        setPeriodEnd(subRes.data.current_period_end);
        setCancelAtPeriodEnd(subRes.data.cancel_at_period_end ?? false);
      }
      setUsage({
        customers: customersRes.count ?? 0,
        records: recordsRes.count ?? 0,
        appointmentsThisMonth: appointmentsRes.count ?? 0,
      });
      setHasReferralBenefit(!!referralRes.data);
      setLoading(false);

      // 決済直後でなければ、または既に反映済みならポーリング不要
      if (!justCheckedOut || currentPlan === "standard") {
        setSyncing(false);
        return;
      }

      // Webhook による反映を待つ
      for (let attempt = 0; attempt < SYNC_MAX_ATTEMPTS; attempt++) {
        await sleep(SYNC_POLL_INTERVAL_MS);
        if (cancelled) return;

        const state = await fetchPlanState(salonId);
        if (cancelled) return;

        if (state.planType === "standard") {
          setPlanType("standard");
          setSubscriptionStatus(state.status);
          setPeriodEnd(state.periodEnd);
          setCancelAtPeriodEnd(state.cancelAtPeriodEnd);
          setSyncing(false);
          return;
        }
      }

      setSyncing(false);
      setSyncTimedOut(true);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [justCheckedOut]);

  return {
    planType,
    periodEnd,
    subscriptionStatus,
    cancelAtPeriodEnd,
    usage,
    hasReferralBenefit,
    loading,
    syncing,
    syncTimedOut,
  };
}
