import type { SalonHpContent } from "@/types/database";

type Props = {
  faq: SalonHpContent["faq"];
  salonName: string;
};

export function HpFaq({ faq, salonName }: Props) {
  if (faq.items.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-gray-900">
          よくあるご質問
        </h2>
        <p className="text-sm text-gray-400 text-center mb-12">FAQ</p>

        <div className="space-y-3">
          {faq.items.map((item, i) => (
            <details
              key={i}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer p-5 font-medium text-sm md:text-base list-none min-h-[56px] hover:bg-gray-50 transition-colors">
                <span className="text-gray-900">{item.question}</span>
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 details-open-rotate"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                {item.answer}
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
