"use client";

import Link from "next/link";
import { getFeatureLabel, type FeatureType } from "@/lib/plan";

type FeatureLockCardProps = {
  feature: FeatureType;
  /** カードのバリアント（インラインで埋める形 vs ページ全体覆う形） */
  variant?: "inline" | "page";
  /** カスタムのリード文（任意） */
  description?: string;
};

const FEATURE_DETAILS: Record<
  FeatureType,
  { icon: string; benefits: string[] }
> = {
  photoStorage: {
    icon: "📸",
    benefits: [
      "ビフォーアフター写真の保存",
      "施術記録に画像を添付",
      "高画質保存（容量無制限）",
    ],
  },
  lineIntegration: {
    icon: "💬",
    benefits: [
      "予約確認・前日リマインドの自動送信",
      "顧客LINEと自動紐付け",
      "Web予約の即時通知",
    ],
  },
  counselingSheet: {
    icon: "📝",
    benefits: [
      "カスタムカウンセリングシート作成",
      "URL/QRコードで事前回答依頼",
      "回答結果をカルテに自動保存",
    ],
  },
  salesAnalytics: {
    icon: "📊",
    benefits: [
      "全期間の月別売上推移",
      "顧客LTV・リピーター分析",
      "新規/リピーター別の月別売上",
    ],
  },
};

/**
 * 機能ロック画面（Freeプランで使えない機能の案内）。
 *
 * variant:
 * - "inline": フォーム途中などに埋め込む
 * - "page":  ページ全体を覆う（LINE設定・カウンセリングテンプレ等）
 */
export function FeatureLockCard({
  feature,
  variant = "inline",
  description,
}: FeatureLockCardProps) {
  const details = FEATURE_DETAILS[feature];
  const label = getFeatureLabel(feature);

  return (
    <div
      className={
        variant === "page"
          ? "bg-surface border border-border rounded-2xl p-6 max-w-md mx-auto text-center space-y-4"
          : "bg-surface border border-border border-dashed rounded-2xl p-5 text-center space-y-3"
      }
    >
      <div className="text-4xl">{details.icon}</div>
      <div>
        <p className="font-bold text-base">
          {label}はスタンダードプランで利用できます
        </p>
        {description && (
          <p className="text-sm text-text-light mt-1">{description}</p>
        )}
      </div>

      <ul className="text-sm text-text-light space-y-1.5 max-w-xs mx-auto text-left">
        {details.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <span className="text-accent mt-0.5">✓</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/settings/billing"
        className="inline-block bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-5 py-3 transition-colors min-h-[44px]"
      >
        スタンダードにアップグレード
      </Link>

      <p className="text-xs text-text-light">
        ¥2,980 / 月（税込）・いつでも解約OK
      </p>
    </div>
  );
}
