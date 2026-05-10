import Image from "next/image";

type JourneyItem = {
  number: string;
  label: string;
  title: string;
  description: string;
  image_path: string;
};

type Props = {
  journey: {
    eyebrow?: string;
    headline?: string;
    subheadline?: string;
    items: JourneyItem[];
  };
};

/** Claude Design: 5ステップグリッド (number / image / title / desc) */
export function HpJourney({ journey }: Props) {
  if (!journey?.items?.length) return null;

  return (
    <section className="px-[5vw] py-24 md:py-[120px] bg-[color:var(--soft)] relative">
      <div className="text-center mb-16 md:mb-20">
        <span className="head-en reveal block">{journey.eyebrow ?? "YOUR JOURNEY"}</span>
        <h2
          className="reveal font-serif-en italic font-light mt-6 leading-none"
          style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
        >
          {journey.headline ?? "A first visit."}
        </h2>
        {journey.subheadline && (
          <p className="reveal font-serif-jp text-xs tracking-[0.4em] text-[color:var(--ink-mute)] mt-5">
            {journey.subheadline}
          </p>
        )}
      </div>

      <div className="max-w-[1180px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-6">
        {journey.items.map((it, i) => (
          <article key={i} className="reveal flex flex-col gap-4">
            <span className="font-serif-en italic text-xs tracking-[0.2em] text-[color:var(--accent)]">
              — {it.number} {it.label}
            </span>
            <div className="reveal-img relative bg-[color:var(--bg)]" style={{ aspectRatio: "4/5" }}>
              <Image
                src={it.image_path}
                alt={`${it.label} - ${it.title}`}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-[1200ms] ease-out hover:scale-[1.06]"
              />
            </div>
            <h4 className="font-serif-jp font-normal text-sm tracking-[0.18em] m-0">
              {it.title}
            </h4>
            <p className="text-[11.5px] leading-[2] text-[color:var(--ink-soft)] m-0 tracking-[0.08em]">
              {it.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
