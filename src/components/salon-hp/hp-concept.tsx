import Image from "next/image";

type Props = {
  concept: {
    eyebrow?: string;
    paragraphs: string[];
    image_path: string;
  };
};

/**
 * Claude Design 仕様の Concept カード:
 *  - カード本体は --soft 背景
 *  - 画像は align-self: start で row 高さに引き伸ばされず、
 *    transform: translate で上左に飛び出す（PC: -32px, モバイル: -12px）
 *  - PCは grid 5/7、モバイルは縦積み
 */
export function HpConcept({ concept }: Props) {
  return (
    <section className="px-[5vw] py-20 md:py-[100px]">
      <div className="hp-concept-card reveal max-w-[1120px] mx-auto relative grid grid-cols-1 md:grid-cols-[5fr_7fr] items-stretch">
        <div
          className="hp-concept-pic reveal-img relative overflow-hidden"
          style={{ aspectRatio: "5/4", alignSelf: "start" }}
        >
          <Image
            src={concept.image_path}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover transition-transform duration-[1400ms] ease-out hover:scale-[1.04]"
          />
        </div>

        <div className="hp-concept-body px-7 py-9 md:px-12 md:py-14 lg:px-16 lg:py-16 md:pl-6">
          <span className="head-en">{concept.eyebrow ?? "CONCEPT"}</span>
          {concept.paragraphs.map((p, i) => (
            <p
              key={i}
              className={`mt-6 md:mt-7 leading-[2.4] tracking-[0.08em] whitespace-pre-line ${
                i === 0 ? "text-[15px] md:text-base" : "text-[12.5px] md:text-[13px]"
              }`}
              style={{
                color: i === 0 ? "var(--ink)" : "var(--ink-soft)",
              }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>

      <style>{`
        .hp-concept-card { background: var(--soft); }
        .hp-concept-pic { transform: translate(-12px, -12px); }
        @media (min-width: 768px) {
          .hp-concept-pic { transform: translate(-32px, -32px); }
        }
      `}</style>
    </section>
  );
}
