import Link from "next/link";

type Props = {
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

export function HpInlineCta({ bookingSlug, bookingEnabled }: Props) {
  if (!bookingEnabled || !bookingSlug) return null;

  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto px-4 text-center">
        {/* 装飾線 */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#C4956A]/20" />
          <div className="w-1 h-1 rotate-45 bg-[#C4956A]/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#C4956A]/20" />
        </div>

        <Link
          href={`/book/${bookingSlug}`}
          className="inline-flex items-center text-[#C4956A] hover:text-[#B8875E] font-medium text-sm transition-colors min-h-[48px]"
        >
          ご予約・お問い合わせはこちら
          <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
