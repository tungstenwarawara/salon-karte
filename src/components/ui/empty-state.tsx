"use client";

import Link from "next/link";
import { EmptyStateIllustration, type IllustrationType } from "./empty-state-illustrations";

type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type EmptyStateProps = {
  /** イラスト種類 */
  illustration: IllustrationType;
  /** メインメッセージ（例: "カルテはまだありません"） */
  message: string;
  /** 補足説明（任意） */
  description?: string;
  /** CTAボタン/リンク（任意） */
  action?: EmptyStateAction;
  /** sm: セクション内, md: ページレベル */
  size?: "sm" | "md";
};

/** 空状態の統一表示コンポーネント（イラスト + テキスト + CTA） */
export function EmptyState({
  illustration,
  message,
  description,
  action,
  size = "sm",
}: EmptyStateProps) {
  const isMd = size === "md";
  const wrapperClass = isMd
    ? "bg-surface border border-border rounded-2xl p-8 text-center space-y-3"
    : "bg-surface border border-border rounded-xl p-6 text-center";

  return (
    <div className={wrapperClass}>
      <EmptyStateIllustration type={illustration} size={size} />

      <p className={`text-text-light ${isMd ? "text-base" : "text-sm"}`}>
        {message}
      </p>

      {description && (
        <p className="text-text-light text-sm opacity-75">{description}</p>
      )}

      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className={
                isMd
                  ? "inline-block mt-3 bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-3 transition-colors min-h-[48px]"
                  : "inline-block mt-2 text-sm text-accent hover:underline font-medium"
              }
            >
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button
              type="button"
              onClick={action.onClick}
              className={
                isMd
                  ? "inline-block mt-3 bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-3 transition-colors min-h-[48px]"
                  : "inline-block mt-2 text-sm text-accent hover:underline font-medium"
              }
            >
              {action.label}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
