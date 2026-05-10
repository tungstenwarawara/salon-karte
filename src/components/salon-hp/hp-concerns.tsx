import type { SalonHpContent } from "@/types/database";

type Props = {
  concerns: NonNullable<SalonHpContent["concerns"]>;
};

/** NANA系: 細罫線の控えめなお悩み一覧 */
export function HpConcerns({ concerns }: Props) {
  return (
    <section className="py-24 md:py-32 hp-section bg-[#F4ECDD]/40">
      <div className="max-w-3xl mx-auto px-5 md:px-10">
        <div className="text-center mb-14 md:mb-16">
          <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-4">Concerns</p>
          <h2
            className="text-xl md:text-2xl font-light tracking-[0.1em] text-gray-800"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            {concerns.title}
          </h2>
        </div>

        <ul className="max-w-md mx-auto space-y-5">
          {concerns.items.map((item, i) => (
            <li key={i} className="flex items-baseline gap-4 border-b border-[#E5DBCB]/70 pb-4">
              <span className="text-[10px] text-[#9B7A52] tracking-widest font-light flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm md:text-[0.95rem] text-gray-700 leading-[1.9] tracking-wider">
                {item}
              </p>
            </li>
          ))}
        </ul>

        <p className="text-center text-xs text-gray-400 mt-14 tracking-wider leading-relaxed">
          — お一人で悩まず、まずはお気軽にご相談ください —
        </p>
      </div>
    </section>
  );
}
