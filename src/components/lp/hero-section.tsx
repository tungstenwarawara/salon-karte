import { BrandLogo } from "@/components/ui/brand-logo";
import { ScrollFadeIn } from "./scroll-fade-in";
import { PhoneFrame } from "./phone-frame";
import { MockDashboardScreen } from "./mockup-screens";
import { CtaLink } from "./cta-link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* 背景グラデーション + 装飾 */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-[#F0ECE8]" />
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-accent/5 blur-3xl animate-orb-drift" />
      <div className="absolute bottom-10 right-[10%] w-56 h-56 rounded-full bg-accent/8 blur-2xl animate-orb-drift-slow" />

      <div className="relative max-w-5xl mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* コピー */}
          <ScrollFadeIn direction="down" className="flex-1 text-center md:text-left">
            <div className="mb-6">
              <BrandLogo size="lg" className="mx-auto md:mx-0" />
            </div>
            <h1 className="text-[2rem] md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.2] mb-6 text-balance [word-break:auto-phrase]">
              カルテも予約も
              <br />
              LINEも。
              <br />
              <span className="text-accent">月額2,980円</span>で、
              <br className="md:hidden" />
              ぜんぶ。
            </h1>
            <p className="text-lg md:text-xl text-text-light leading-relaxed mb-8 text-pretty [word-break:auto-phrase]">
              個人サロンのための、
              <br className="md:hidden" />
              やさしいサロン管理アプリ
            </p>
            <div className="space-y-4">
              <CtaLink
                href="/signup"
                trackingLocation="hero"
                trackingLabel="無料ではじめる"
                className="inline-flex items-center justify-center bg-accent hover:bg-accent-light text-white font-bold rounded-2xl px-10 py-4 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 min-h-[56px] animate-cta-pulse"
              >
                無料ではじめる
              </CtaLink>
              <div className="text-sm text-text-light flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
                <span className="whitespace-nowrap">初期費用0円</span>
                <span className="text-text-light/50" aria-hidden>・</span>
                <span className="whitespace-nowrap">クレジットカード不要</span>
                <span className="text-text-light/50" aria-hidden>・</span>
                <span className="whitespace-nowrap">いつでも解約OK</span>
              </div>
            </div>
            {/* 信頼バッジ */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-8">
              {["全機能利用可能", "いつでも解約OK", "スマホだけでOK"].map((text) => (
                <span key={text} className="inline-flex items-center gap-1.5 text-sm text-text-light bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-border/50">
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {text}
                </span>
              ))}
            </div>
          </ScrollFadeIn>

          {/* スマホモックアップ */}
          <ScrollFadeIn direction="right" delay={300} className="flex-shrink-0">
            <div className="animate-float-phone">
              <PhoneFrame>
                <MockDashboardScreen />
              </PhoneFrame>
            </div>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
}

