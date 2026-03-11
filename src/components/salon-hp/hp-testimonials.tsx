import type { SalonHpContent } from "@/types/database";

type Props = {
  testimonials: SalonHpContent["testimonials"];
};

export function HpTestimonials({ testimonials }: Props) {
  if (testimonials.items.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-gray-900">
          お客様の声
        </h2>
        <p className="text-sm text-gray-400 text-center mb-12">Voice</p>

        <div className="space-y-4">
          {testimonials.items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100"
            >
              {/* 引用マーク */}
              <div className="text-[#C4956A]/30 text-4xl font-serif leading-none mb-2">"</div>
              <p className="text-gray-600 leading-relaxed mb-4">
                {item.content}
              </p>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-[#F5F1ED] flex items-center justify-center text-[#C4956A] text-xs font-medium">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-700">{item.name}</p>
                  {item.menu && (
                    <p className="text-gray-400 text-xs">{item.menu}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
