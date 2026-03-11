import type { SalonHpContent } from "@/types/database";

type Props = {
  gallery: SalonHpContent["gallery"];
};

export function HpGallery({ gallery }: Props) {
  if (gallery.images.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-gray-900">
          サロンギャラリー
        </h2>
        <p className="text-sm text-gray-400 text-center mb-12">Gallery</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {gallery.images.map((img, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl overflow-hidden bg-[#F5F1ED]"
            >
              {/* TODO: Supabase Storage の公開URLで画像表示 */}
              <div className="w-full h-full bg-gradient-to-br from-[#F5F1ED] to-[#E8E0D8] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#C4956A]/30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
              {img.caption && (
                <p className="text-xs text-gray-400 mt-1 px-1 truncate">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
