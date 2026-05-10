type WhyItem = {
  number: string;
  label: string;
  title: string;
  description: string;
};

type Props = {
  whySei: {
    eyebrow?: string;
    headline?: string;
    headline_em?: string;
    lead?: string;
    items: WhyItem[];
  };
};

/** Claude Design: WHY SEI 3つのカード、上罫線・番号ラベル */
export function HpWhySei({ whySei }: Props) {
  return (
    <section className="py-28 md:py-[140px] px-[5vw]">
      <div className="max-w-[1180px] mx-auto mb-12 md:mb-20 flex flex-wrap items-end justify-between gap-10">
        <div>
          <span className="head-en reveal block">{whySei.eyebrow ?? "WHY SEI"}</span>
          <h2
            className="reveal font-serif-en italic font-light text-[color:var(--ink)] mt-4 leading-[1.05]"
            style={{ fontSize: "clamp(40px, 5.5vw, 80px)" }}
          >
            {whySei.headline ?? "Quietly,"}
            <br />
            <em style={{ fontStyle: "normal" }}>
              {whySei.headline_em ?? "your own line."}
            </em>
          </h2>
        </div>
        {whySei.lead && (
          <p className="reveal max-w-[380px] text-[13px] text-[color:var(--ink-soft)] leading-[2.2] m-0">
            {whySei.lead}
          </p>
        )}
      </div>

      <div className="max-w-[1180px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-14">
        {whySei.items.map((it, i) => (
          <article key={i} className="reveal relative pt-9 border-t border-[color:var(--ink)]">
            <span
              className="font-serif-en italic text-[13px] tracking-[0.2em] text-[color:var(--ink-mute)] absolute -top-2.5 right-0 px-3 bg-[color:var(--bg)]"
            >
              {it.number} / {it.label}
            </span>
            <h3 className="font-serif-jp font-normal text-[19px] tracking-[0.16em] leading-[1.7] m-0 mb-4 whitespace-pre-line">
              {it.title}
            </h3>
            <p className="text-[13px] text-[color:var(--ink-soft)] leading-[2.2] m-0">
              {it.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
