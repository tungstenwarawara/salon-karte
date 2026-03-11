import type { SalonHpContent } from "@/types/database";

type Props = {
  about: SalonHpContent["about"];
};

export function HpAbout({ about }: Props) {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900">
          {about.title}
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* オーナー写真 */}
          {about.owner_image_path ? (
            <div className="flex-shrink-0">
              <div className="w-40 h-40 rounded-full bg-[#F5F1ED] overflow-hidden">
                {/* TODO: Supabase Storage から画像表示 */}
                <div className="w-full h-full bg-gradient-to-br from-[#F5F1ED] to-[#E8E0D8]" />
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#F5F1ED] to-[#E8E0D8] flex items-center justify-center">
                <svg className="w-16 h-16 text-[#C4956A]/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                </svg>
              </div>
            </div>
          )}

          {/* テキスト */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-4">
              <p className="font-bold text-lg text-gray-900">{about.owner_name}</p>
              <p className="text-sm text-gray-500">{about.owner_title}</p>
            </div>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {about.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
