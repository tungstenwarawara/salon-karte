import type { SalonHpContent } from "@/types/database";
import Image from "next/image";

type Props = {
  beforeAfter: NonNullable<SalonHpContent["before_after"]>;
};

export function HpBeforeAfter({ beforeAfter }: Props) {
  if (beforeAfter.items.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[#FAF7F3] to-[#F5F0EA] hp-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          {beforeAfter.title || "施術実績"}
        </h2>
        <p className="text-xs tracking-[0.3em] text-[#C4956A] text-center mb-4 uppercase">
          Before &amp; After
        </p>
        <p className="text-sm text-gray-400 text-center mb-14">
          実際のお客様の変化をご覧ください
        </p>

        <div className="space-y-8">
          {beforeAfter.items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E8E0D8]/60 shadow-sm overflow-hidden"
            >
              {/* Before/After 合成画像 */}
              <div className="relative aspect-[4/3] bg-[#F5F1ED]">
                <Image
                  src={item.image_path}
                  alt={item.caption}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>

              {/* キャプション */}
              <div className="p-5">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {item.caption}
                </p>
                {item.menu && (
                  <p className="text-xs text-[#C4956A] mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {item.menu}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-300 text-center mt-8">
          ※ 効果には個人差があります。施術内容・回数により異なります。
        </p>
      </div>
    </section>
  );
}
