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
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8F5F1] via-[#F3EDE7] to-white" />
      <div className="absolute top-20 right-[15%] w-64 h-64 rounded-full bg-[#C4956A]/8 blur-3xl" />
      <div className="absolute bottom-20 left-[10%] w-48 h-48 rounded-full bg-[#C4956A]/5 blur-2xl" />

      <div className="relative max-w-3xl mx-auto px-4 text-center py-24">
        {/* サロン名 */}
        <p className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-8">
          {salonName}
        </p>

        {/* メインコピー */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.3] mb-6 text-gray-900">
          {hero.headline}
        </h1>

        <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-12 max-w-xl mx-auto">
          {hero.subheadline}
        </p>

        {/* CTA */}
        {bookingEnabled && bookingSlug && (
          <div className="space-y-3">
            <Link
              href={`/book/${bookingSlug}`}
              className="inline-flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-full px-10 py-4 text-base transition-all duration-300 hover:shadow-lg min-h-[56px]"
            >
              ご予約はこちら
            </Link>
            <p className="text-xs text-gray-400">
              Web予約 ・ 24時間受付
            </p>
          </div>
        )}

        {/* 装飾線 */}
        <div className="mt-16 flex items-center justify-center gap-2">
          <div className="w-8 h-px bg-[#C4956A]/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#C4956A]/40" />
          <div className="w-8 h-px bg-[#C4956A]/30" />
        </div>
      </div>
    </section>
  );
}
