/** 最終CTAセクション */

import Link from "next/link";
import { ScrollFadeIn } from "./scroll-fade-in";

export function FinalCtaSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* アクセントグラデーション背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-accent/5 to-background" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/8 blur-3xl animate-orb-drift" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/5 blur-2xl animate-orb-drift-slow" />

      <ScrollFadeIn className="relative max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          まずは無料ではじめてみませんか？
        </h2>
        <p className="text-text-light text-lg leading-relaxed mb-8">
          面倒な初期設定は不要。5分で登録完了、
          <br className="hidden md:inline" />
          今日からサロン管理をもっとラクに。
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center justify-center bg-accent hover:bg-accent-light text-white font-bold rounded-2xl px-12 py-5 text-xl transition-all duration-300 hover:shadow-xl hover:shadow-accent/25 min-h-[64px] animate-cta-pulse"
        >
          無料ではじめる
        </Link>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-sm text-text-light">
          <span>初期費用0円</span>
          <span>全機能利用可能</span>
          <span>いつでも解約OK</span>
        </div>
      </ScrollFadeIn>
    </section>
  );
}
