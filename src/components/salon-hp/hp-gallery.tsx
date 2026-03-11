import type { SalonHpContent } from "@/types/database";
import Image from "next/image";

type Props = {
  gallery: SalonHpContent["gallery"];
};

export function HpGallery({ gallery }: Props) {
  if (gallery.images.length === 0) return null;

  return (
    <section className="py-20 md:py-28 hp-section">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          サロンギャラリー
        </h2>
        <p className="text-xs tracking-[0.3em] text-[#C4956A] text-center mb-14 uppercase">Gallery</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {gallery.images.map((img, i) => (
            <div
              key={i}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#F5F1ED] border border-[#E8E0D8]/40"
            >
              <Image
                src={img.path}
                alt={img.caption || `ギャラリー ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
                loading="lazy"
              />
              {/* ホバー時キャプション */}
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-xs text-white truncate">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
