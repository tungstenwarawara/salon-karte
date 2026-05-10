import type { SalonHpContent } from "@/types/database";
import Image from "next/image";

type Props = {
  gallery: SalonHpContent["gallery"];
};

/** NANA系: 影なしの均等グリッド、薄ホバーオーバーレイ */
export function HpGallery({ gallery }: Props) {
  if (gallery.images.length === 0) return null;

  return (
    <section className="py-24 md:py-32 hp-section bg-white">
      <div className="max-w-5xl mx-auto px-5 md:px-10">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-4">Gallery</p>
          <h2
            className="text-2xl md:text-[1.6rem] font-light tracking-[0.1em] text-gray-800"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            サロンの空間
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {gallery.images.map((img, i) => (
            <div
              key={i}
              className="group relative aspect-[4/5] overflow-hidden bg-[#F4ECDD]"
            >
              <Image
                src={img.path}
                alt={img.caption || `ギャラリー ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="lazy"
              />
              {img.caption && (
                <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                  <p className="relative text-[11px] tracking-[0.15em] text-white p-4 leading-relaxed">
                    {img.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
