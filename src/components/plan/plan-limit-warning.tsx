"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getLimitLabel,
  getRemainingQuota,
  isApproachingLimit,
  type LimitType,
  type PlanType,
} from "@/lib/plan";

type PlanLimitWarningProps = {
  planType: PlanType;
  type: LimitType;
  current: number;
  /** localStorage に保存する識別子（同じ警告を毎日見せない） */
  dismissKey?: string;
};

/**
 * 80%到達時に表示する警告バナー。
 *
 * 表示条件:
 * - planType === 'free'
 * - isApproachingLimit() === true
 *
 * 「× で閉じる」と localStorage に記録し、24時間は再表示しない。
 */
export function PlanLimitWarning({
  planType,
  type,
  current,
  dismissKey = `plan-warning-${type}`,
}: PlanLimitWarningProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(dismissKey);
    if (!stored) return false;
    const dismissedAt = parseInt(stored, 10);
    const now = Date.now();
    // 24時間以内に閉じていれば表示しない
    return now - dismissedAt < 24 * 60 * 60 * 1000;
  });

  // standard プランは表示しない
  if (planType !== "free") return null;
  // 80%未満なら表示しない
  if (!isApproachingLimit(planType, type, current)) return null;
  // ユーザーが閉じた直後は表示しない
  if (dismissed) return null;

  const remaining = getRemainingQuota(planType, type, current);

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, Date.now().toString());
    setDismissed(true);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
      <span className="text-lg leading-none mt-0.5">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-yellow-900">
          もうすぐ{getLimitLabel(type)}の上限です
        </p>
        <p className="text-xs text-yellow-800 mt-0.5">
          あと <span className="font-bold">{remaining}</span>{" "}
          {type === "appointmentsThisMonth" ? "件" : type === "customers" ? "人" : "件"}
          で新規登録できなくなります
        </p>
        <Link
          href="/settings/billing"
          className="inline-block mt-2 text-xs font-medium text-accent hover:underline"
        >
          スタンダードプランを見る →
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="text-yellow-800 hover:text-yellow-900 p-1 -m-1 rounded"
        aria-label="閉じる"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
