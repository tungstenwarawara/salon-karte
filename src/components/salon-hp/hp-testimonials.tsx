import type { SalonHpContent } from "@/types/database";

type Props = {
  testimonials: SalonHpContent["testimonials"];
};

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-[#E8B86D]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function HpTestimonials({ testimonials }: Props) {
  if (testimonials.items.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[#FAF7F3] to-[#F5F0EA] hp-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          お客様の声
        </h2>
        <p className="text-xs tracking-[0.3em] text-[#C4956A] text-center mb-4 uppercase">Voice</p>

        {/* 全体評価バッジ */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <StarRating />
          <span className="text-sm font-bold text-gray-700">5.0</span>
          <span className="text-xs text-gray-400">（口コミ14件）</span>
        </div>

        <div className="space-y-4">
          {testimonials.items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 md:p-7 border border-[#E8E0D8]/60 shadow-sm"
            >
              <div className="flex items-start gap-4">
                {/* アバター */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F0EBE4] to-[#E4DACE] flex items-center justify-center text-[#C4956A] text-sm font-bold flex-shrink-0 mt-0.5">
                  {item.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* 名前 + 星 */}
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                    <StarRating />
                  </div>

                  {/* コメント */}
                  <p className="text-gray-600 leading-[1.8] text-[0.93rem]">
                    {item.content}
                  </p>

                  {/* メニュー名 */}
                  {item.menu && (
                    <p className="text-xs text-[#C4956A] mt-3 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {item.menu}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
