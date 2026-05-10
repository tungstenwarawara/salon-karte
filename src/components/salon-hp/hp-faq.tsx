import type { SalonHpContent } from "@/types/database";

type Props = {
  faq: SalonHpContent["faq"];
  salonName: string;
};

/** NANA / Claude Design テイストの細罫線アコーディオン */
export function HpFaq({ faq }: Props) {
  if (faq.items.length === 0) return null;

  return (
    <section className="px-[5vw] py-24 md:py-[120px] max-w-[880px] mx-auto">
      <div className="text-center mb-16 md:mb-20">
        <span className="head-en reveal block">FAQ</span>
        <h2
          className="reveal font-serif-en italic font-light mt-6 leading-none"
          style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
        >
          Questions.
        </h2>
        <p className="reveal font-serif-jp text-xs tracking-[0.4em] text-[color:var(--ink-mute)] mt-5">
          — よくあるご質問
        </p>
      </div>

      <div className="border-t border-[color:var(--line)]">
        {faq.items.map((item, i) => (
          <details
            key={i}
            className="reveal group border-b border-[color:var(--line)]"
          >
            <summary className="flex items-baseline justify-between gap-5 cursor-pointer py-7 list-none">
              <span className="flex items-baseline gap-5 md:gap-7">
                <span className="font-serif-en italic text-[color:var(--accent)] text-sm tracking-[0.18em]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-serif-jp text-[15px] tracking-[0.16em] leading-[1.7] text-[color:var(--ink)]">
                  {item.question}
                </span>
              </span>
              <span className="relative w-3 h-3 flex-shrink-0">
                <span className="absolute top-1/2 left-0 w-3 h-px bg-[color:var(--ink)] -translate-y-1/2" />
                <span className="absolute top-0 left-1/2 w-px h-3 bg-[color:var(--ink)] -translate-x-1/2 transition-transform duration-300 group-open:scale-y-0" />
              </span>
            </summary>
            <div className="pb-8 pl-9 md:pl-12 pr-3">
              <p className="text-[13px] leading-[2.2] tracking-[0.06em] text-[color:var(--ink-soft)] whitespace-pre-line">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }),
        }}
      />
    </section>
  );
}
