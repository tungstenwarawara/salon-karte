import type { SalonHpContent } from "@/types/database";

type Props = {
  concerns: NonNullable<SalonHpContent["concerns"]>;
};

export function HpConcerns({ concerns }: Props) {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[#FAF7F3] to-[#F5F0EA] hp-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          {concerns.title}
        </h2>
        <p className="text-xs tracking-[0.3em] text-[#C4956A] text-center mb-14 uppercase">Concerns</p>

        <div className="max-w-md mx-auto space-y-4">
          {concerns.items.map((item, i) => (
            <div key={i} className="flex items-start gap-3.5">
              {/* チェックマーク */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C4956A]/10 flex items-center justify-center mt-0.5">
                <svg className="w-3.5 h-3.5 text-[#C4956A]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-gray-700 leading-relaxed text-[0.95rem]">{item}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-12 leading-relaxed">
          お一人で悩まず、まずはお気軽にご相談ください。
        </p>
      </div>
    </section>
  );
}
