import Link from "next/link";

type Props = {
  bookingSlug: string | null;
  bookingEnabled: boolean;
  salonName: string;
};

export function HpBookingCta({ bookingSlug, bookingEnabled, salonName }: Props) {
  if (!bookingEnabled || !bookingSlug) return null;

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 text-center">
        {/* 装飾線 */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-px bg-[#C4956A]/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#C4956A]/40" />
          <div className="w-8 h-px bg-[#C4956A]/30" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          ご予約をお待ちしております
        </h2>
        <p className="text-gray-500 mb-10">
          {salonName}で、あなただけの特別な時間をお過ごしください。
        </p>

        <Link
          href={`/book/${bookingSlug}`}
          className="inline-flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-full px-12 py-4 text-base transition-all duration-300 hover:shadow-lg min-h-[56px]"
        >
          Web予約はこちら
        </Link>
        <p className="text-xs text-gray-400 mt-3">
          24時間受付 ・ キャンセル無料
        </p>
      </div>
    </section>
  );
}
