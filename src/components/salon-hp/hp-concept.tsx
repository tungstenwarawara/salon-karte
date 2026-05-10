import Image from "next/image";

type Props = {
  concept: {
    eyebrow?: string;
    paragraphs: string[];
    image_path: string;
    cta_label?: string;
  };
};

/** Claude Design: オフセット画像カード（写真が左にずれて飛び出す） */
export function HpConcept({ concept }: Props) {
  return (
    <section className="px-[5vw] py-20 md:py-[100px]">
      <div className="reveal max-w-[1120px] mx-auto bg-[color:var(--soft)] grid grid-cols-1 md:grid-cols-[5fr_7fr] items-stretch relative">
        {/* 左: 写真（カードから -32px ずらして飛び出す） */}
        <div
          className="reveal-img md:col-span-1"
          style={{
            aspectRatio: "5/4",
            transform: "translate(-16px, -16px)",
            alignSelf: "start",
          }}
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

        {/* 右: 本文 */}
        <div className="px-7 md:px-16 md:pl-6 py-9 md:py-16">
          <span className="head-en">{concept.eyebrow ?? "CONCEPT"}</span>
          {concept.paragraphs.map((p, i) => (
            <p
              key={i}
              className={`mt-8 leading-[2.4] tracking-[0.08em] ${
                i === 0
                  ? "text-base text-[color:var(--ink)]"
                  : "text-[13px] text-[color:var(--ink-soft)]"
              }`}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
