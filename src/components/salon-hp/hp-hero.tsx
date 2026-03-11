import type { SalonHpContent } from "@/types/database";
import Link from "next/link";

type Props = {
  hero: SalonHpContent["hero"];
  salonName: string;
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

export function HpHero({ hero, salonName, bookingSlug, bookingEnabled }: Props) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* 背景グラデーション — ウォームゴールド */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F9F5F0] via-[#F3EBE1] to-[#FBF8F4]" />

      {/* 装飾オーブ */}
      <div className="absolute top-16 right-[12%] w-80 h-80 rounded-full bg-[#C4956A]/10 blur-[80px] hp-orb-float" />
      <div className="absolute bottom-24 left-[8%] w-60 h-60 rounded-full bg-[#D4AD8A]/8 blur-[60px] hp-orb-float-slow" />
      <div className="absolute top-[40%] left-[50%] w-40 h-40 rounded-full bg-[#C4956A]/5 blur-[40px] hp-orb-float" />

      {/* 装飾パターン — 薄い斜線 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, #C4956A 0, #C4956A 1px, transparent 0, transparent 50%)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 text-center py-28 hp-section">
        {/* サロン名 — レタースペース広め */}
        <p className="text-xs tracking-[0.4em] text-[#C4956A] uppercase mb-10 font-medium">
          {salonName}
        </p>

        {/* メインコピー — 大きく堂々と */}
        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.35] mb-8 text-gray-900 whitespace-pre-line">
          {hero.headline}
        </h1>

        {/* サブコピー */}
        <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-14 max-w-lg mx-auto whitespace-pre-line">
          {hero.subheadline}
        </p>

        {/* CTA — ゴールド系 */}
        {bookingEnabled && bookingSlug && (
          <div className="space-y-4">
            <Link
              href={`/book/${bookingSlug}`}
              className="inline-flex items-center justify-center bg-[#C4956A] hover:bg-[#B8875E] text-white font-bold rounded-full px-12 py-4 text-base transition-all duration-300 min-h-[56px] hp-cta-glow"
            >
              ご予約はこちら
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <p className="text-xs text-gray-400 tracking-wide">
              Web予約 24時間受付 ・ 完全個室
            </p>
          </div>
        )}

        {/* 装飾ダイヤ */}
        <div className="mt-20 flex items-center justify-center gap-3">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#C4956A]/30" />
          <div className="w-2 h-2 rotate-45 border border-[#C4956A]/30" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#C4956A]/30" />
        </div>
      </div>
    </section>
  );
}
