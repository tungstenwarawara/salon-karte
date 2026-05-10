import type { SalonHpContent } from "@/types/database";

type Props = {
  testimonials: SalonHpContent["testimonials"];
};

/** NANA系: 影なし、引用符記号、シンプルな仕切り罫線 */
export function HpTestimonials({ testimonials }: Props) {
  if (testimonials.items.length === 0) return null;

  const rating = testimonials.hotpepper_rating ?? 5.0;
  const reviewCount = testimonials.hotpepper_review_count ?? testimonials.items.length;

  return (
    <section className="py-24 md:py-32 hp-section bg-[#F4ECDD]/40">
      <div className="max-w-3xl mx-auto px-5 md:px-10">
        <div className="text-center mb-12 md:mb-14">
          <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-4">Voice</p>
          <h2
            className="text-2xl md:text-[1.6rem] font-light tracking-[0.1em] text-gray-800 mb-6"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            お客様の声
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-3.5 h-3.5 text-[#C9A671]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs tracking-wider text-gray-600">
              {rating.toFixed(1)} ／ 口コミ {reviewCount}件
            </span>
          </div>
        </div>

        <div className="space-y-12 md:space-y-14">
          {testimonials.items.map((item, i) => (
            <figure
              key={i}
              className="relative pt-2 border-b border-[#E5DBCB]/60 pb-12 last:border-b-0 last:pb-0"
            >
              {/* 装飾的な引用符 */}
              <span
                className="absolute -top-3 left-0 text-5xl md:text-6xl text-[#9B7A52]/25 leading-none select-none"
                style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
              >
                &ldquo;
              </span>

              <blockquote className="pl-8 md:pl-12 text-sm md:text-[0.95rem] text-gray-700 leading-[2.2] tracking-wider whitespace-pre-line">
                {item.content}
              </blockquote>

              <figcaption className="pl-8 md:pl-12 mt-6 flex items-center gap-3 text-[11px] tracking-[0.2em] text-gray-500">
                <span className="w-6 h-px bg-[#9B7A52]/40" />
                <span>{item.name}</span>
                {item.menu && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-[#9B7A52]">{item.menu}</span>
                  </>
                )}
              </figcaption>
            </figure>
          ))}
        </div>

        {testimonials.hotpepper_url && (
          <div className="mt-14 text-center">
            <a
              href={testimonials.hotpepper_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 text-[11px] tracking-[0.3em] text-[#9B7A52] uppercase hover:text-gray-900 transition-colors"
            >
              <span className="w-8 h-px bg-current" />
              View More Reviews
              <svg
                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
