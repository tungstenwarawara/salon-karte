import type { SalonHpContent } from "@/types/database";

type Props = {
  faq: SalonHpContent["faq"];
  salonName: string;
};

/** NANA系: 細罫線アコーディオン、+/- アイコン、影なし */
export function HpFaq({ faq }: Props) {
  if (faq.items.length === 0) return null;

  return (
    <section className="py-24 md:py-32 hp-section bg-white">
      <div className="max-w-3xl mx-auto px-5 md:px-10">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-4">FAQ</p>
          <h2
            className="text-2xl md:text-[1.6rem] font-light tracking-[0.1em] text-gray-800"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            よくあるご質問
          </h2>
        </div>

        <div className="border-t border-[#E5DBCB]/60">
          {faq.items.map((item, i) => (
            <details key={i} className="group border-b border-[#E5DBCB]/60">
              <summary className="flex items-center justify-between gap-4 cursor-pointer py-5 md:py-6 list-none">
                <span className="flex items-baseline gap-4 md:gap-5">
                  <span
                    className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase flex-shrink-0"
                    style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
                  >
                    Q.
                  </span>
                  <span className="text-sm md:text-[0.95rem] text-gray-800 tracking-wider leading-[1.7]">
                    {item.question}
                  </span>
                </span>
                <span className="relative w-3 h-3 flex-shrink-0">
                  <span className="absolute top-1/2 left-0 w-3 h-px bg-[#9B7A52] -translate-y-1/2" />
                  <span className="absolute top-0 left-1/2 w-px h-3 bg-[#9B7A52] -translate-x-1/2 transition-transform duration-300 group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <div className="pb-6 md:pb-7 pl-8 md:pl-10 pr-3">
                <p className="text-sm text-gray-600 leading-[2] tracking-wider whitespace-pre-line">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>

        {/* JSON-LD FAQPage */}
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
      </div>
    </section>
  );
}
