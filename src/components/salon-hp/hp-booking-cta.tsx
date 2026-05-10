import Link from "next/link";

type Props = {
  bookingSlug: string | null;
  bookingEnabled: boolean;
  salonName: string;
};

/** NANA系: 最終CTAも控えめなセリフ + 細枠ボタン */
export function HpBookingCta({ bookingSlug, bookingEnabled, salonName }: Props) {
  if (!bookingEnabled || !bookingSlug) return null;

  return (
    <section id="booking-cta" className="py-28 md:py-36 hp-section bg-[#FAF6F0]">
      <div className="max-w-3xl mx-auto px-5 md:px-10 text-center">
        <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-5">Reservation</p>
        <h2
          className="text-2xl md:text-[1.7rem] font-light tracking-[0.1em] text-gray-800 mb-6"
          style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
        >
          ご予約をお待ちしております
        </h2>
        <p className="text-sm text-gray-500 leading-[2] tracking-wider mb-12">
          {salonName} で、あなただけの特別な時間をお過ごしください。
        </p>

        <Link
          href={`/book/${bookingSlug}`}
          className="group inline-flex items-center gap-4 border border-[#9B7A52] text-[#9B7A52] hover:bg-[#9B7A52] hover:text-white tracking-[0.3em] text-xs uppercase px-10 py-5 transition-all duration-300 min-h-[56px]"
        >
          <span className="w-6 h-px bg-current" />
          Reserve Online
          <svg
            className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
        <p className="text-[10px] tracking-[0.25em] text-gray-400 mt-6 uppercase">
          24h online · cancel free
        </p>
      </div>
    </section>
  );
}
