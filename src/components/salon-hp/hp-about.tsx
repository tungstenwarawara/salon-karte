import type { SalonHpContent } from "@/types/database";
import Image from "next/image";

type Props = {
  about: SalonHpContent["about"];
};

/**
 * NANA系の About:
 *  - 左: オーナー写真（額装風、円形でなく長方形）
 *  - 右: 役職・氏名・説明 + ストーリー + メッセージ
 *  - セリフタイポ・余白広め・細罫線
 */
export function HpAbout({ about }: Props) {
  return (
    <section className="py-24 md:py-32 hp-section bg-white">
      <div className="max-w-5xl mx-auto px-5 md:px-10">
        {/* セクション見出し */}
        <div className="text-center mb-16 md:mb-20">
          <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-4">About</p>
          <h2
            className="text-2xl md:text-[1.6rem] font-light tracking-[0.1em] text-gray-800"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            {about.title}
          </h2>
        </div>

        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
          {/* 左: オーナー写真 */}
          <div className="md:col-span-5">
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              {about.owner_image_path ? (
                <Image
                  src={about.owner_image_path}
                  alt={about.owner_name}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#F0E6D6] to-[#E8DBC4] flex items-center justify-center">
                  <span className="w-16 h-px bg-[#9B7A52]/30" />
                </div>
              )}
            </div>

            {/* 氏名 — 写真直下に細セリフで */}
            <div className="mt-6 md:mt-8">
              <p className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase mb-2">
                Owner / Therapist
              </p>
              <p
                className="text-lg md:text-xl text-gray-800 mb-1 tracking-wider"
                style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
              >
                {about.owner_name}
              </p>
              <p className="text-xs text-gray-500 tracking-wider">{about.owner_title}</p>
            </div>
          </div>

          {/* 右: 説明 + ストーリー + メッセージ */}
          <div className="md:col-span-7">
            <p className="text-sm md:text-[0.95rem] text-gray-600 leading-[2.2] tracking-wider whitespace-pre-line mb-10">
              {about.description}
            </p>

            {/* オーナーストーリー */}
            {about.story && (
              <div className="mb-10">
                <p className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase mb-4">
                  Story
                </p>
                <p className="text-sm text-gray-600 leading-[2.2] tracking-wider whitespace-pre-line">
                  {about.story}
                </p>
              </div>
            )}

            {/* 資格 */}
            {about.qualifications && about.qualifications.length > 0 && (
              <div className="mb-10">
                <p className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase mb-4">
                  Qualifications
                </p>
                <ul className="space-y-2 text-sm text-gray-600 tracking-wider">
                  {about.qualifications.map((q, i) => (
                    <li key={i} className="flex items-baseline gap-3">
                      <span className="w-4 h-px bg-[#9B7A52]/40 flex-shrink-0 translate-y-2" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* メッセージ */}
            {about.message && (
              <div>
                <p className="text-[10px] tracking-[0.3em] text-[#9B7A52] uppercase mb-4">
                  Message
                </p>
                <blockquote className="border-l border-[#9B7A52]/40 pl-5 text-sm text-gray-600 leading-[2.2] tracking-wider whitespace-pre-line italic">
                  {about.message}
                </blockquote>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
