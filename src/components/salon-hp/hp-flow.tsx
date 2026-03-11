import type { SalonHpContent } from "@/types/database";

type Props = {
  flow: SalonHpContent["flow"];
};

export function HpFlow({ flow }: Props) {
  if (flow.steps.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-gray-900">
          施術の流れ
        </h2>
        <p className="text-sm text-gray-400 text-center mb-12">Flow</p>

        <div className="space-y-0">
          {flow.steps.map((step, i) => (
            <div key={i} className="flex gap-5">
              {/* ステップ番号 + 接続線 */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#C4956A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                {i < flow.steps.length - 1 && (
                  <div className="w-px flex-1 bg-[#C4956A]/20 my-1" />
                )}
              </div>

              {/* コンテンツ */}
              <div className="pb-8 pt-1.5 flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
