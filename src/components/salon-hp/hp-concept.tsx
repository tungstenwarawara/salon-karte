import Image from "next/image";

type Props = {
  concept: {
    eyebrow?: string;
    paragraphs: string[];
    image_path: string;
  };
};

/**
 * Concept セクション (シンプル版)
 *  - モバイル: 画像 → カード を縦積み
 *  - PC: カード(右半分) + 画像が左半分に absolute で配置（カードの左上に -24px 飛び出す）
 *  - 画像とテキストが絶対に重ならないよう、本文は marginLeft で画像分の幅を確保
 */
export function HpConcept({ concept }: Props) {
  return (
    <section className="px-[5vw] py-20 md:py-[120px]">
      {/* モバイル: シンプル縦積み */}
      <div className="md:hidden max-w-[560px] mx-auto reveal">
        <div className="reveal-img relative w-full overflow-hidden" style={{ aspectRatio: "5/4" }}>
          <Image src={concept.image_path} alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="px-6 py-9" style={{ background: "var(--soft)" }}>
          <span className="head-en">{concept.eyebrow ?? "CONCEPT"}</span>
          {concept.paragraphs.map((p, i) => (
            <p
              key={i}
              className={`mt-5 leading-[2.3] tracking-[0.08em] whitespace-pre-line ${
                i === 0 ? "text-[15px]" : "text-[12.5px]"
              }`}
              style={{ color: i === 0 ? "var(--ink)" : "var(--ink-soft)" }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* PC: 画像が左に absolute、テキストが右に marginLeft 確保 */}
      <div className="hidden md:block reveal">
        <div
          className="relative max-w-[1120px] mx-auto"
          style={{
            background: "var(--soft)",
            minHeight: "420px",
          }}
        >
          {/* 画像: 左半分に絶対配置、上左 -24px はみ出す */}
          <div
            className="reveal-img absolute overflow-hidden"
            style={{
              top: "-24px",
              left: "-24px",
              width: "44%",
              aspectRatio: "5/4",
            }}
          >
            <Image
              src={concept.image_path}
              alt=""
              fill
              sizes="(max-width: 1120px) 44vw, 490px"
              className="object-cover transition-transform duration-[1400ms] ease-out hover:scale-[1.04]"
            />
          </div>

          {/* 本文: 画像幅分(44%) + バッファ(40px) を marginLeft で確保 → 重ならない */}
          <div
            style={{
              marginLeft: "calc(44% + 40px)",
              paddingTop: "64px",
              paddingRight: "64px",
              paddingBottom: "64px",
            }}
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
      </div>
    </section>
  );
}
