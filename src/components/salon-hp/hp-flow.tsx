import type { SalonHpContent } from "@/types/database";

type Props = {
  flow: SalonHpContent["flow"];
};

/** NANA系: 細罫線の縦タイムライン、ステップ番号はセリフ書体で控えめに */
export function HpFlow({ flow }: Props) {
  if (flow.steps.length === 0) return null;

  return (
    <section className="py-24 md:py-32 hp-section bg-[#F4ECDD]/40">
      <div className="max-w-3xl mx-auto px-5 md:px-10">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-4">Flow</p>
          <h2
            className="text-2xl md:text-[1.6rem] font-light tracking-[0.1em] text-gray-800"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            施術の流れ
          </h2>
        </div>

        <ol className="space-y-10 md:space-y-12">
          {flow.steps.map((step, i) => (
            <li
              key={i}
              className="grid grid-cols-12 gap-5 md:gap-8 items-start border-b border-[#E5DBCB]/60 pb-10 last:border-b-0 last:pb-0"
            >
              <div className="col-span-2 md:col-span-2">
                <p
                  className="text-2xl md:text-3xl font-light text-[#9B7A52] tracking-[0.1em]"
                  style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
              </div>
              <div className="col-span-10">
                <h3
                  className="text-base md:text-lg text-gray-800 mb-2 md:mb-3 font-light tracking-wider"
                  style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-[2] tracking-wider whitespace-pre-line">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
