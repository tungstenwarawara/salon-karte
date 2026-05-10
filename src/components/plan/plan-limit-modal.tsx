"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PLAN_LIMITS,
  getLimitLabel,
  getFeatureLabel,
  type LimitType,
  type FeatureType,
} from "@/lib/plan";

type PlanLimitModalProps = {
  /** 制限到達した項目（カウント系 or 機能ロック系のいずれか） */
  blockType:
    | { kind: "limit"; type: LimitType; current: number }
    | { kind: "feature"; feature: FeatureType };
  /** 紹介経由で30日無料が適用される場合 true */
  hasReferralBenefit?: boolean;
  onClose: () => void;
};

/**
 * フリープラン制限到達 / 機能ロック時に表示する案内モーダル。
 *
 * 設計:
 * - ハードな壁ではなく「決断ポイント」を提示
 * - 主要CTA = アップグレード（/settings/billing へ遷移）
 * - 副次CTA = 戻る（前画面に戻ってデータ整理など）
 * - 紹介経由なら30日無料を強調
 */
export function PlanLimitModal({
  blockType,
  hasReferralBenefit = false,
  onClose,
}: PlanLimitModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    // ESCキーで閉じる
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  // タイトル・本文の出し分け
  const title =
    blockType.kind === "limit"
      ? `${getLimitLabel(blockType.type)}の登録上限に達しました`
      : `${getFeatureLabel(blockType.feature)}はスタンダードプランで利用できます`;

  const subtitle =
    blockType.kind === "limit"
      ? `おためしプランは${formatLimit(blockType.type)}まで`
      : "全機能を使うにはアップグレードが必要です";

  const currentText =
    blockType.kind === "limit"
      ? `現在: ${blockType.current} / ${formatLimit(blockType.type)}`
      : null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        visible ? "bg-text/30 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-surface rounded-2xl max-w-md w-full shadow-xl transition-all duration-200 max-h-[90vh] overflow-y-auto ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-5 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold leading-tight">{title}</h2>
              <p className="text-sm text-text-light mt-1">{subtitle}</p>
              {currentText && (
                <p className="text-xs text-text-light mt-2 font-mono">
                  {currentText}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-text-light hover:text-text rounded-lg p-1 -m-1"
              aria-label="閉じる"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
        </div>

        {/* プラン比較 */}
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* おためし */}
            <div className="bg-background border border-border rounded-xl p-3 space-y-2">
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
                <li className="text-text-light/70">写真・LINE 不可</li>
              </ul>
            </div>

            {/* スタンダード */}
            <div className="bg-accent/5 border-2 border-accent rounded-xl p-3 space-y-2 relative">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <p className="text-xs font-bold text-accent">おすすめ</p>
              </div>
              <p className="text-sm font-bold">{PLAN_LIMITS.standard.label}</p>
              <p className="text-base font-bold">
                ¥{PLAN_LIMITS.standard.monthlyPriceJpy.toLocaleString()}{" "}
                <span className="text-xs font-normal text-text-light">/月</span>
              </p>
              <ul className="text-xs space-y-1">
                <li>顧客 無制限</li>
                <li>カルテ 無制限</li>
                <li>予約 無制限</li>
                <li className="text-accent font-medium">写真・LINE すべて利用可</li>
              </ul>
            </div>
          </div>

          {/* 紹介特典 */}
          {hasReferralBenefit && (
            <div className="bg-accent/10 border border-accent rounded-xl p-3 flex items-start gap-2">
              <span className="text-lg leading-none">🎁</span>
              <div>
                <p className="text-sm font-bold text-accent">紹介特典が適用されます</p>
                <p className="text-xs text-text-light mt-0.5">
                  最初の30日間は無料でご利用いただけます
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="p-5 border-t border-border space-y-2">
          <Link
            href="/settings/billing"
            className="block bg-accent hover:bg-accent-light text-white font-bold rounded-2xl px-4 py-3 text-center text-base transition-colors min-h-[48px] leading-7"
          >
            スタンダードに切り替える
          </Link>
          <button
            onClick={handleClose}
            className="block w-full text-center text-sm text-text-light hover:text-text py-3 min-h-[44px]"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}

/** 制限項目の値を表示用にフォーマット */
function formatLimit(type: LimitType): string {
  switch (type) {
    case "customers":
      return `${PLAN_LIMITS.free.maxCustomers}人`;
    case "records":
      return `${PLAN_LIMITS.free.maxRecords}件`;
    case "appointmentsThisMonth":
      return `月${PLAN_LIMITS.free.maxAppointmentsPerMonth}件`;
  }
}
