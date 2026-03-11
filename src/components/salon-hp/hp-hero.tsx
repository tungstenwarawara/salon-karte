import type { SalonHpContent } from "@/types/database";
import Image from "next/image";
import Link from "next/link";

type Props = {
  hero: SalonHpContent["hero"];
  salonName: string;
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

export function HpHero({ hero, salonName, bookingSlug, bookingEnabled }: Props) {
  const hasImage = !!hero.image_path;

  return (
    <section id="hero-section" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* 背景: 写真がある場合は実画像、ない場合はグラデーション */}
      {hasImage ? (
        <>
          <Image
            src={hero.image_path!}
            alt={salonName}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* 写真の上に暗めのオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#F9F5F0] via-[#F3EBE1] to-[#FBF8F4]" />
          <div className="absolute top-16 right-[12%] w-80 h-80 rounded-full bg-[#C4956A]/10 blur-[80px] hp-orb-float" />
          <div className="absolute bottom-24 left-[8%] w-60 h-60 rounded-full bg-[#D4AD8A]/8 blur-[60px] hp-orb-float-slow" />
          <div className="absolute top-[40%] left-[50%] w-40 h-40 rounded-full bg-[#C4956A]/5 blur-[40px] hp-orb-float" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, #C4956A 0, #C4956A 1px, transparent 0, transparent 50%)",
              backgroundSize: "24px 24px",
            }}
          />
        </>
      )}

      <div className="relative max-w-3xl mx-auto px-4 text-center py-28 hp-section">
        {/* サロン名 — レタースペース広め */}
        <p className={`text-xs tracking-[0.4em] uppercase mb-10 font-medium ${hasImage ? "text-white/80" : "text-[#C4956A]"}`}>
          {salonName}
        </p>

        {/* メインコピー — 大きく堂々と */}
        <h1 className={`text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.35] mb-8 whitespace-pre-line ${hasImage ? "text-white drop-shadow-lg" : "text-gray-900"}`}>
          {hero.headline}
        </h1>

        {/* サブコピー */}
        <p className={`text-base md:text-lg leading-relaxed max-w-lg mx-auto whitespace-pre-line ${hasImage ? "text-white/85" : "text-gray-500"} ${hero.trust_badges && hero.trust_badges.length > 0 ? "mb-8" : "mb-14"}`}>
          {hero.subheadline}
        </p>

        {/* 信頼バッジ */}
        {hero.trust_badges && hero.trust_badges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {hero.trust_badges.map((badge, i) => (
              <div
                key={i}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm border ${
                  hasImage
                    ? "bg-white/15 backdrop-blur-sm text-white border-white/25"
                    : "bg-white/80 backdrop-blur-sm text-gray-700 border-[#E8E0D8]/60 shadow-sm"
                }`}
              >
                <span className="font-bold">{badge.value}</span>
                <span className={hasImage ? "text-white/70" : "text-gray-500"}>{badge.label}</span>
              </div>
            ))}
          </div>
        )}

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
            <p className={`text-xs tracking-wide ${hasImage ? "text-white/60" : "text-gray-400"}`}>
              Web予約 24時間受付 ・ 完全個室
            </p>
          </div>
        )}

        {/* 装飾ダイヤ */}
        <div className="mt-20 flex items-center justify-center gap-3">
          <div className={`w-12 h-px bg-gradient-to-r from-transparent ${hasImage ? "to-white/30" : "to-[#C4956A]/30"}`} />
          <div className={`w-2 h-2 rotate-45 border ${hasImage ? "border-white/30" : "border-[#C4956A]/30"}`} />
          <div className={`w-12 h-px bg-gradient-to-l from-transparent ${hasImage ? "to-white/30" : "to-[#C4956A]/30"}`} />
        </div>
      </div>
    </section>
  );
}
