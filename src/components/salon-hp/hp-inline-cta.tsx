import Link from "next/link";

type Props = {
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

/** NANA系: 細枠ボタン、em-dash 装飾、控えめだが目を引く */
export function HpInlineCta({ bookingSlug, bookingEnabled }: Props) {
  if (!bookingEnabled || !bookingSlug) return null;

  return (
    <div className="py-14 md:py-16 hp-section bg-white">
      <div className="max-w-3xl mx-auto px-5 md:px-10 text-center">
        <Link
          href={`/book/${bookingSlug}`}
          className="group inline-flex items-center gap-3 border border-[#9B7A52] text-[#9B7A52] hover:bg-[#9B7A52] hover:text-white tracking-[0.25em] text-[11px] uppercase px-8 py-4 transition-all duration-300 min-h-[48px]"
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
      </div>
    </div>
  );
}
