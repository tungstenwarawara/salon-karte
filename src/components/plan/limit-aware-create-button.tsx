"use client";

import Link from "next/link";
import { useState } from "react";
import { PlanLimitModal } from "./plan-limit-modal";
import { isAtLimit, type LimitType, type PlanType } from "@/lib/plan";

type LimitAwareCreateButtonProps = {
  href: string;
  label: string;
  planType: PlanType;
  type: LimitType;
  current: number;
  hasReferralBenefit?: boolean;
  /** ボタンの追加クラス（外枠サイズ調整など） */
  className?: string;
};

/**
 * カウント系制限を考慮した「+ 登録」ボタン。
 *
 * 上限到達時は Link → button に切り替えて Modal を表示する。
 * 上限未満時は通常の Link。
 *
 * カルテ・予約のヘッダー部分で使う。顧客は CustomerList 側に直接組み込み済み。
 */
export function LimitAwareCreateButton({
  href,
  label,
  planType,
  type,
  current,
  hasReferralBenefit = false,
  className = "bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center",
}: LimitAwareCreateButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const atLimit = isAtLimit(planType, type, current);

  if (atLimit) {
    return (
      <>
        <button onClick={() => setShowModal(true)} className={className}>
          {label}
        </button>
        {showModal && (
          <PlanLimitModal
            blockType={{ kind: "limit", type, current }}
            hasReferralBenefit={hasReferralBenefit}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
