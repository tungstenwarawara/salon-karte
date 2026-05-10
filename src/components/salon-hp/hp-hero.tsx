import type { SalonHpContent } from "@/types/database";
import Image from "next/image";
import Link from "next/link";

type Props = {
  hero: SalonHpContent["hero"];
  salonName: string;
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

/**
 * NANA系の非対称ヒーロー:
 *  - クリーム背景・余白多め
 *  - 左: サロン名（細セリフ・大文字・letter-spacing広め）+ サブコピー + 信頼バッジ + CTA
 *  - 右: 写真をフルブリードでなく、額装風に配置（縦長アスペクト維持）
 *  - 重い装飾（オーブ・グラデオーバーレイ）を排除し、写真の上品さを活かす
 */
export function HpHero({ hero, salonName, bookingSlug, bookingEnabled }: Props) {
  const hasImage = !!hero.image_path;

  return (
    <section
      id="hero-section"
      className="relative bg-[#FAF6F0] hp-section"
    >
      <div className="max-w-6xl mx-auto px-5 md:px-10 pt-28 pb-20 md:pt-36 md:pb-32 grid md:grid-cols-12 gap-10 md:gap-14 items-center">
        {/* 左: テキスト */}
        <div className="md:col-span-5 order-2 md:order-1">
          {/* セリフ風サロン名（英語キャッチコピーがあれば英語で表示するパターン） */}
          <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-6 md:mb-8">
            Bust Care Salon
          </p>

          {/* メイン見出し: 細セリフ・大文字・改行で間を取る */}
          <h1
            className="font-light tracking-[0.05em] text-gray-800 leading-[1.4] mb-6 md:mb-8"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            <span className="block text-2xl md:text-[1.8rem] mb-1">{salonName}</span>
            <span className="block text-[1.05rem] md:text-[1.3rem] text-gray-500 mt-3 leading-[1.7] tracking-[0.02em] whitespace-pre-line">
              {hero.headline}
            </span>
          </h1>

          {/* サブコピー */}
          <p className="text-sm text-gray-500 leading-[2] tracking-wider mb-8 md:mb-10 whitespace-pre-line max-w-md">
            {hero.subheadline}
          </p>

          {/* 信頼バッジ — 細罫線シンプル */}
          {hero.trust_badges && hero.trust_badges.length > 0 && (
            <div className="space-y-2 mb-10 md:mb-12 max-w-xs">
              {hero.trust_badges.map((badge, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-3 border-b border-[#E5DBCB]/70 pb-2 text-sm"
                >
                  <span className="text-[10px] tracking-[0.2em] text-[#9B7A52] uppercase">
                    {badge.label}
                  </span>
                  <span className="text-gray-700 tracking-wider">{badge.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA — em-dash 装飾の細枠ボタン */}
          {bookingEnabled && bookingSlug && (
            <div>
              <Link
                href={`/book/${bookingSlug}`}
                className="group inline-flex items-center gap-3 border border-[#9B7A52] text-[#9B7A52] hover:bg-[#9B7A52] hover:text-white tracking-[0.2em] text-xs uppercase px-7 py-4 transition-all duration-300 min-h-[48px]"
              >
                <span className="w-6 h-px bg-current" />
                Reserve Now
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Link>
              <p className="text-[10px] tracking-[0.2em] text-gray-400 mt-4 uppercase">
                24h online reservation · 完全個室
              </p>
            </div>
          )}
        </div>

        {/* 右: 写真（額装風、フルブリードでない） */}
        <div className="md:col-span-7 order-1 md:order-2 relative">
          {hasImage ? (
            <div className="relative aspect-[4/5] md:aspect-[3/4] w-full overflow-hidden">
              <Image
                src={hero.image_path!}
                alt={salonName}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
              />
              {/* ごく薄い陰影で雰囲気を整える（写真自体は損なわない） */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/[0.04] via-transparent to-transparent" />
            </div>
          ) : (
            <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-[#F0E6D6] to-[#E8DBC4] flex items-center justify-center">
              <div className="w-32 h-px bg-[#9B7A52]/30" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
