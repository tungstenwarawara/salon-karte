import type { SalonHpContent } from "@/types/database";

type Props = {
  faq: SalonHpContent["faq"];
  salonName: string;
};

export function HpFaq({ faq, salonName }: Props) {
  if (faq.items.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[#FAF7F3] to-[#F5F0EA] hp-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          よくあるご質問
        </h2>
        <p className="text-xs tracking-[0.3em] text-[#C4956A] text-center mb-14 uppercase">FAQ</p>

        <div className="space-y-3">
          {faq.items.map((item, i) => (
            <details
              key={i}
              className="group bg-white rounded-2xl border border-[#E8E0D8]/60 shadow-sm overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer p-6 font-medium text-sm md:text-base list-none min-h-[56px] hover:bg-[#FAF7F3]/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#C4956A]/10 text-[#C4956A] flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    Q
                  </span>
                  <span className="text-gray-900">{item.question}</span>
                </div>
                <svg
                  className="w-5 h-5 text-[#C4956A]/50 flex-shrink-0 transition-transform duration-200 details-open-rotate"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="px-6 pb-6 border-t border-[#E8E0D8]/40">
                <div className="flex gap-3 pt-5">
                  <span className="w-7 h-7 rounded-full bg-[#C4956A] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    A
                  </span>
                  <p className="text-sm text-gray-600 leading-[1.8]">
                    {item.answer}
                  </p>
                </div>
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
