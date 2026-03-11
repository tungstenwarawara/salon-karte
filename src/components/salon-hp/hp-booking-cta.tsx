import Link from "next/link";

type Props = {
  bookingSlug: string | null;
  bookingEnabled: boolean;
  salonName: string;
};

export function HpBookingCta({ bookingSlug, bookingEnabled, salonName }: Props) {
  if (!bookingEnabled || !bookingSlug) return null;

  return (
    <section className="py-20 md:py-28 hp-section">
      <div className="max-w-3xl mx-auto px-4 text-center">
        {/* 装飾線 */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#C4956A]/30" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#C4956A]/40" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#C4956A]/30" />
        </div>

        <p className="text-xs tracking-[0.3em] text-[#C4956A] mb-6 uppercase">Reservation</p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          ご予約をお待ちしております
        </h2>
        <p className="text-gray-500 mb-10 leading-relaxed">
          {salonName}で、あなただけの特別な時間をお過ごしください。
        </p>

        <Link
          href={`/book/${bookingSlug}`}
          className="inline-flex items-center justify-center bg-[#C4956A] hover:bg-[#B8875E] text-white font-bold rounded-full px-14 py-4 text-base transition-all duration-300 min-h-[56px] hp-cta-glow"
        >
          Web予約はこちら
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <p className="text-xs text-gray-400 mt-4 tracking-wide">
          24時間受付 ・ キャンセル無料
        </p>
      </div>
    </section>
  );
}
