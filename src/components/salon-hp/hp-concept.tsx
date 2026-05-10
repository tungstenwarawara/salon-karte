import type { SalonHpContent } from "@/types/database";

type Props = {
  concept: SalonHpContent["concept"];
};

/** NANA系: ローマ数字付き縦並びコンセプト（カードの影なし、細罫線） */
export function HpConcept({ concept }: Props) {
  return (
    <section className="py-24 md:py-32 hp-section bg-white">
      <div className="max-w-4xl mx-auto px-5 md:px-10">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-4">Concept</p>
          <h2
            className="text-2xl md:text-[1.6rem] font-light tracking-[0.1em] text-gray-800"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            {concept.title}
          </h2>
        </div>

        <div className="space-y-12 md:space-y-14">
          {concept.points.map((point, i) => (
            <div
              key={i}
              className="grid md:grid-cols-12 gap-5 md:gap-10 items-start border-b border-[#E5DBCB]/60 pb-12 last:border-b-0 last:pb-0"
            >
              {/* 左: ローマ数字 */}
              <div className="md:col-span-2">
                <p
                  className="text-3xl md:text-4xl font-light text-[#9B7A52] tracking-[0.1em]"
                  style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
              </div>

              {/* 右: 見出し + 本文 */}
              <div className="md:col-span-10">
                <h3
                  className="text-lg md:text-xl text-gray-800 mb-3 md:mb-4 font-light tracking-wider"
                  style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
                >
                  {point.title}
                </h3>
                <p className="text-sm md:text-[0.95rem] text-gray-600 leading-[2] tracking-wider whitespace-pre-line">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
