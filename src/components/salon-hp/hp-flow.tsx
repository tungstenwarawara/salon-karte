import type { SalonHpContent } from "@/types/database";

type Props = {
  flow: SalonHpContent["flow"];
};

export function HpFlow({ flow }: Props) {
  if (flow.steps.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[#FAF7F3] to-[#F5F0EA] hp-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          施術の流れ
        </h2>
        <p className="text-xs tracking-[0.3em] text-[#C4956A] text-center mb-14 uppercase">Flow</p>

        <div className="space-y-0">
          {flow.steps.map((step, i) => (
            <div key={i} className="flex gap-5 md:gap-7">
              {/* ステップ番号 + 接続線 */}
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-[#C4956A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm shadow-[#C4956A]/20">
                  {i + 1}
                </div>
                {i < flow.steps.length - 1 && (
                  <div className="w-px flex-1 bg-gradient-to-b from-[#C4956A]/30 to-[#C4956A]/10 my-1" />
                )}
              </div>

              {/* コンテンツ */}
              <div className="pb-10 pt-2 flex-1">
                <h3 className="font-bold text-gray-900 mb-1.5 text-[1.05rem]">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-[1.8]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
