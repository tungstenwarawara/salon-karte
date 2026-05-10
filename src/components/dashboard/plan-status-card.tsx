"use client";

import Link from "next/link";
import {
  PLAN_LIMITS,
  getPlanLabel,
  isApproachingLimit,
  isAtLimit,
  type PlanType,
} from "@/lib/plan";

type Props = {
  planType: PlanType;
  customerCount: number;
  recordCount: number;
  hasReferralBenefit?: boolean;
};

/**
 * ダッシュボード上部のプラン状態カード。
 *
 * - 現在のプラン名 + 料金（¥0 or ¥2,980）
 * - 顧客・カルテの使用状況サマリ
 * - 紹介特典バッジ（被紹介者のみ）
 * - 80%超 or 100% で警告色
 */
export function PlanStatusCard({
  planType,
  customerCount,
  recordCount,
  hasReferralBenefit = false,
}: Props) {
  const customersAtLimit = isAtLimit(planType, "customers", customerCount);
  const recordsAtLimit = isAtLimit(planType, "records", recordCount);
  const customersApproaching = isApproachingLimit(planType, "customers", customerCount);
  const recordsApproaching = isApproachingLimit(planType, "records", recordCount);

  const anyAtLimit = customersAtLimit || recordsAtLimit;
  const anyApproaching = customersApproaching || recordsApproaching;

  // フリープランかつ未満：通常表示。スタンダード：シンプル表示。警告：色付き。
  const bgClass = anyAtLimit
    ? "bg-error/5 border-error/30"
    : anyApproaching
      ? "bg-yellow-50 border-yellow-200"
      : "bg-surface border-border";

  return (
    <Link
      href="/settings/billing"
      className={`block ${bgClass} border rounded-2xl p-3 hover:opacity-90 transition-opacity`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              planType === "standard" ? "bg-accent" : "bg-text-light"
            }`}
          />
          <p className="text-sm font-bold truncate">
            {getPlanLabel(planType)}
            <span className="text-xs font-normal text-text-light ml-1.5">
              ¥{PLAN_LIMITS[planType].monthlyPriceJpy.toLocaleString()}/月
            </span>
          </p>
          {hasReferralBenefit && planType === "free" && (
            <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
              🎁 30日無料
            </span>
          )}
        </div>
        <span className="text-text-light text-xs flex-shrink-0">›</span>
      </div>

      {/* フリープランのみ使用状況サマリを表示 */}
      {planType === "free" && (
        <div className="flex items-center gap-3 mt-2 text-xs text-text-light flex-wrap">
          <span>
            顧客{" "}
            <span className={customersAtLimit ? "text-error font-bold" : customersApproaching ? "text-yellow-700 font-bold" : "font-medium"}>
              {customerCount}/{PLAN_LIMITS.free.maxCustomers}
            </span>
          </span>
          <span className="text-text-light/40">・</span>
          <span>
            カルテ{" "}
            <span className={recordsAtLimit ? "text-error font-bold" : recordsApproaching ? "text-yellow-700 font-bold" : "font-medium"}>
              {recordCount}/{PLAN_LIMITS.free.maxRecords}
            </span>
          </span>
        </div>
      )}

      {anyAtLimit && (
        <p className="text-xs text-error mt-1.5 font-medium">
          上限到達 — アップグレードして無制限に
        </p>
      )}
    </Link>
  );
}
