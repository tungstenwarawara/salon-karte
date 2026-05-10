import Image from "next/image";

type Props = {
  concept: {
    eyebrow?: string;
    paragraphs: string[];
    image_path: string;
    cta_label?: string;
  };
};

/**
 * Claude Design 系の Concept セクション。
 * デスクトップ: 左に写真、右にカード（写真がカード境界を上に飛び出す）
 * モバイル: 写真の下にカード（オフセットなしで素直に積む）
 */
export function HpConcept({ concept }: Props) {
  return (
    <section className="px-[5vw] py-20 md:py-[120px]">
      <div className="reveal max-w-[1120px] mx-auto">
        {/* desktop: 5/7 grid with photo overlapping. mobile: stacked */}
        <div className="hidden md:grid md:grid-cols-[5fr_7fr] items-stretch relative">
          {/* 写真は外側に flex で配置し、上端を -32px ずらす */}
          <div
            className="reveal-img relative z-10 -mt-8 -ml-8"
            style={{ aspectRatio: "5/4" }}
          >
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={concept.image_path}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover transition-transform duration-[1400ms] ease-out hover:scale-[1.04]"
              />
            </div>
          </div>
          {/* カード本体 */}
          <div
            className="px-12 py-14 lg:px-16 lg:py-16"
            style={{ background: "var(--soft)" }}
          >
            <span className="head-en">{concept.eyebrow ?? "CONCEPT"}</span>
            {concept.paragraphs.map((p, i) => (
              <p
                key={i}
                className={`mt-7 leading-[2.4] tracking-[0.08em] whitespace-pre-line ${
                  i === 0 ? "text-base" : "text-[13px]"
                }`}
                style={{ color: i === 0 ? "var(--ink)" : "var(--ink-soft)" }}
              >
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* mobile: 写真 → カード を素直に積む */}
        <div className="md:hidden">
          <div className="reveal-img relative" style={{ aspectRatio: "5/4" }}>
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={concept.image_path}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="px-7 py-9" style={{ background: "var(--soft)" }}>
            <span className="head-en">{concept.eyebrow ?? "CONCEPT"}</span>
            {concept.paragraphs.map((p, i) => (
              <p
                key={i}
                className={`mt-6 leading-[2.3] tracking-[0.08em] whitespace-pre-line ${
                  i === 0 ? "text-[15px]" : "text-[13px]"
                }`}
                style={{ color: i === 0 ? "var(--ink)" : "var(--ink-soft)" }}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
