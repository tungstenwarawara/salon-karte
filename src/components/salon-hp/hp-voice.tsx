import type { SalonHpContent } from "@/types/database";

type Props = {
  testimonials: SalonHpContent["testimonials"];
};

/** Claude Design: 3カードグリッド、引用符・浮き上がりホバー */
export function HpVoice({ testimonials }: Props) {
  if (testimonials.items.length === 0) return null;

  return (
    <section className="px-[5vw] py-24 md:py-[120px] bg-[color:var(--soft-3)]">
      <div className="text-center mb-16 md:mb-20">
        <span className="head-en reveal block">VOICE</span>
        <h2
          className="reveal font-serif-en italic font-light mt-6 leading-none"
          style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
        >
          From our guests.
        </h2>
        <p className="reveal font-serif-jp text-xs tracking-[0.4em] text-[color:var(--ink-mute)] mt-5">
          — 通ってくださる方の声
        </p>
      </div>

      <div className="max-w-[1180px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-7">
        {testimonials.items.map((it, i) => (
          <div
            key={i}
            className="reveal bg-white px-9 py-12 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)]"
          >
            <span className="font-serif-en italic text-[56px] leading-[0.5] text-[color:var(--accent)] block mb-5">
              &ldquo;
            </span>
            <p className="text-[13px] leading-[2.2] text-[color:var(--ink)] m-0 mb-7 tracking-[0.06em]">
              {it.content}
            </p>
            <div className="flex justify-between pt-5 border-t border-[color:var(--line)] text-[11px] text-[color:var(--ink-mute)] tracking-[0.18em]">
              <span className="font-serif-jp text-[color:var(--ink-soft)]">{it.name}</span>
              {it.menu && <span>{it.menu}</span>}
            </div>
          </div>
        ))}
      </div>

      {testimonials.hotpepper_url && (
        <div className="text-center mt-12">
          <a
            href={testimonials.hotpepper_url}
            target="_blank"
            rel="noopener noreferrer"
            className="reveal inline-block font-sans-en text-[10.5px] tracking-[0.32em] uppercase border-b border-[color:var(--ink)] pb-1 hover:opacity-70 transition-opacity"
          >
            View More on HotPepper →
          </a>
        </div>
      )}
    </section>
  );
}
