import type { SalonHpContent } from "@/types/database";
import Link from "next/link";

type Props = {
  pricing: NonNullable<SalonHpContent["pricing"]>;
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

export function HpPricing({ pricing, bookingSlug, bookingEnabled }: Props) {
  const hasAnchoring = pricing.original_price && pricing.trial_price;
  const discountRate = hasAnchoring
    ? Math.round((1 - pricing.trial_price! / pricing.original_price!) * 100)
    : null;

  return (
    <section className="py-20 md:py-28 hp-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          {pricing.title}
        </h2>
        <p className="text-xs tracking-[0.3em] text-[#C4956A] text-center mb-14 uppercase">Special Offer</p>

        {/* 料金カード */}
        <div className="max-w-md mx-auto bg-white rounded-2xl border-2 border-[#C4956A]/20 shadow-lg p-8 md:p-10 text-center">
          {/* 価格アンカリング */}
          {hasAnchoring && (
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-lg text-gray-400 line-through">
                ¥{pricing.original_price!.toLocaleString()}
              </span>
              {discountRate && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-0.5">
                  {discountRate}%OFF
                </span>
              )}
            </div>
          )}

          {/* メイン価格 */}
          {pricing.trial_price && (
            <div className="mb-4">
              <span className="text-4xl md:text-5xl font-bold text-[#C4956A]">
                ¥{pricing.trial_price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 ml-1">（税込）</span>
            </div>
          )}

          {/* 説明 */}
          {pricing.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-8">
              {pricing.description}
            </p>
          )}

          {/* CTA */}
          {bookingEnabled && bookingSlug && (
            <Link
              href={`/book/${bookingSlug}`}
              className="inline-flex items-center justify-center bg-[#C4956A] hover:bg-[#B8875E] text-white font-bold rounded-full px-10 py-4 text-base transition-all duration-300 min-h-[56px] hp-cta-glow w-full max-w-xs"
            >
              このコースを予約する
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          )}

          {/* 注意書き */}
          {pricing.note && (
            <p className="text-xs text-gray-400 mt-4">
              ※ {pricing.note}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
