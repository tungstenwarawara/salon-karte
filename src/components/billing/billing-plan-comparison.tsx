"use client";

import { PLAN_LIMITS } from "@/lib/plan";

type Props = {
  hasReferralBenefit: boolean;
  actionLoading: boolean;
  onUpgrade: () => void;
};

/** プラン比較カード + アップグレードボタン */
export function BillingPlanComparison({
  hasReferralBenefit,
  actionLoading,
  onUpgrade,
}: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <h3 className="font-bold">プラン比較</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* おためし */}
        <div className="border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-text-light" />
            <p className="text-xs font-bold text-text-light">利用中</p>
          </div>
          <p className="text-sm font-bold">{PLAN_LIMITS.free.label}</p>
          <p className="text-base font-bold">
            ¥0 <span className="text-xs font-normal text-text-light">/月</span>
          </p>
          <ul className="text-xs space-y-1 text-text-light">
            <li>顧客 {PLAN_LIMITS.free.maxCustomers}人</li>
            <li>カルテ {PLAN_LIMITS.free.maxRecords}件</li>
            <li>予約 月{PLAN_LIMITS.free.maxAppointmentsPerMonth}件</li>
            <li className="text-text-light/70">写真 ✗</li>
            <li className="text-text-light/70">LINE ✗</li>
            <li className="text-text-light/70">カウンセリング ✗</li>
            <li className="text-text-light/70">売上分析 ✗</li>
          </ul>
        </div>

        {/* スタンダード */}
        <div className="border-2 border-accent bg-accent/5 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <p className="text-xs font-bold text-accent">おすすめ</p>
          </div>
          <p className="text-sm font-bold">{PLAN_LIMITS.standard.label}</p>
          <p className="text-base font-bold">
            ¥{PLAN_LIMITS.standard.monthlyPriceJpy.toLocaleString()}
            <span className="text-xs font-normal text-text-light"> /月</span>
          </p>
          <ul className="text-xs space-y-1">
            <li>顧客 無制限</li>
            <li>カルテ 無制限</li>
            <li>予約 無制限</li>
            <li className="text-accent">写真 ✓</li>
            <li className="text-accent">LINE ✓</li>
            <li className="text-accent">カウンセリング ✓</li>
            <li className="text-accent">売上分析 ✓</li>
          </ul>
        </div>
      </div>

      <button
        onClick={onUpgrade}
        disabled={actionLoading}
        className="w-full bg-accent hover:bg-accent-light text-white font-bold rounded-2xl py-4 text-center text-lg transition-colors disabled:opacity-50 min-h-[56px]"
      >
        {actionLoading
          ? "読み込み中..."
          : hasReferralBenefit
            ? "30日無料で始める"
            : "スタンダードにアップグレード"}
      </button>
      <p className="text-xs text-text-light text-center">
        {hasReferralBenefit
          ? "クレジットカード登録 → 31日目から ¥2,980/月（税込）"
          : "クレジットカード登録 → 即日 ¥2,980/月（税込）課金開始"}
      </p>
    </div>
  );
}
