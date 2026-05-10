"use client";

import {
  PLAN_LIMITS,
  getUsageRatio,
  type LimitType,
  type PlanType,
} from "@/lib/plan";

type UsageBarProps = {
  label: string;
  type: LimitType;
  current: number;
  planType: PlanType;
  unit: string;
};

/** 進捗バー：使用状況の可視化（80%超で黄、100%で赤） */
export function UsageBar({ label, type, current, planType, unit }: UsageBarProps) {
  const limit =
    type === "customers"
      ? PLAN_LIMITS[planType].maxCustomers
      : type === "records"
        ? PLAN_LIMITS[planType].maxRecords
        : PLAN_LIMITS[planType].maxAppointmentsPerMonth;
  const ratio = getUsageRatio(planType, type, current);
  const limitDisplay = isFinite(limit) ? `${limit}` : "無制限";

  const barColor =
    ratio >= 1 ? "bg-error" : ratio >= 0.8 ? "bg-yellow-500" : "bg-accent";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-text-light font-mono text-xs">
          {current}
          {unit} / {limitDisplay}
        </span>
      </div>
      <div className="bg-background rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** ロック中の機能行（Free プランで使えない機能の表示用） */
export function LockedFeatureRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-text-light">{label}</span>
      <span className="text-xs text-text-light flex items-center gap-1">
        🔒 スタンダードで利用可能
      </span>
    </div>
  );
}
