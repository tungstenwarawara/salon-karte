import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ScrollFadeIn } from "./scroll-fade-in";

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
            <h1 className="text-[2rem] md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.2] mb-6">
              カルテも予約も
              <br />
              LINEも。
              <br />
              <span className="text-accent">月額2,980円</span>で、
              <br className="md:hidden" />
              ぜんぶ。
            </h1>
            <p className="text-lg md:text-xl text-text-light leading-relaxed mb-8">
              個人サロンのための、やさしいサロン管理アプリ
            </p>
            <div className="space-y-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-accent hover:bg-accent-light text-white font-bold rounded-2xl px-10 py-4 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 min-h-[56px] animate-cta-pulse"
              >
                無料ではじめる
              </Link>
              <p className="text-sm text-text-light">
                初期費用0円 ・ クレジットカード不要 ・ いつでも解約OK
              </p>
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
            <PhoneMockup />
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
}

/** CSS製スマホフレーム — ダッシュボード画面 */
function PhoneMockup() {
  return (
    <div className="relative animate-float-phone">
      <div className="absolute inset-0 bg-accent/10 rounded-[44px] blur-2xl scale-105" />
      <div className="relative w-[260px] md:w-[280px] bg-white rounded-[36px] border-[6px] border-[#2D2D2D] shadow-2xl overflow-hidden">
        {/* ノッチ */}
        <div className="bg-[#2D2D2D] h-7 flex items-center justify-center">
          <div className="w-20 h-4 bg-[#1a1a1a] rounded-full" />
        </div>
        {/* ダッシュボード */}
        <div className="bg-background p-3 space-y-3" style={{ minHeight: 460 }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text">ダッシュボード</span>
            <div className="w-6 h-6 rounded-full bg-accent/20" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MockCard label="今日の予約" value="3件" accent />
            <MockCard label="今月の売上" value="¥248,500" />
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-border space-y-2">
            <span className="text-[10px] font-bold text-text-light">本日の予約</span>
            {[
              { t: "10:00", n: "田中 様", m: "カット+カラー" },
              { t: "13:00", n: "佐藤 様", m: "トリートメント" },
              { t: "15:30", n: "鈴木 様", m: "パーマ" },
            ].map((a) => (
              <div key={a.t} className="flex items-center gap-2 py-1 border-b border-border/50 last:border-0">
                <span className="text-[10px] font-medium text-accent w-8">{a.t}</span>
                <span className="text-[10px] font-medium flex-1">{a.n}</span>
                <span className="text-[9px] text-text-light">{a.m}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {["カルテ", "予約", "顧客", "売上"].map((l) => (
              <div key={l} className="bg-white rounded-lg p-2 text-center border border-border">
                <div className="w-5 h-5 rounded-full bg-accent/10 mx-auto mb-1" />
                <span className="text-[9px] text-text-light">{l}</span>
              </div>
            ))}
          </div>
        </div>
        {/* ホームバー */}
        <div className="bg-white border-t border-border h-5 flex items-center justify-center">
          <div className="w-24 h-1 bg-border rounded-full" />
        </div>
      </div>
    </div>
  );
}

function MockCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-2.5 border border-border">
      <div className="text-[10px] text-text-light">{label}</div>
      <div className={`text-lg font-bold ${accent ? "text-accent" : "text-text"}`}>{value}</div>
    </div>
  );
}
