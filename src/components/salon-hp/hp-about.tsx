import type { SalonHpContent } from "@/types/database";
import Image from "next/image";

type Props = {
  about: SalonHpContent["about"];
};

export function HpAbout({ about }: Props) {
  return (
    <section className="py-20 md:py-28 hp-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          {about.title}
        </h2>
        <p className="text-xs tracking-[0.3em] text-[#C4956A] text-center mb-14 uppercase">About</p>

        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* オーナー写真 */}
          <div className="flex-shrink-0">
            <div className="w-44 h-44 rounded-full overflow-hidden ring-4 ring-[#C4956A]/10 ring-offset-4 ring-offset-white">
              {about.owner_image_path ? (
                <Image
                  src={about.owner_image_path}
                  alt={about.owner_name}
                  width={176}
                  height={176}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#F0EBE4] to-[#E4DACE] flex items-center justify-center">
                  <svg className="w-20 h-20 text-[#C4956A]/25" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* テキスト */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-5">
              <p className="font-bold text-xl text-gray-900">{about.owner_name}</p>
              <p className="text-sm text-[#C4956A] mt-1">{about.owner_title}</p>
            </div>
            <p className="text-gray-600 leading-[1.9] whitespace-pre-line text-[0.95rem]">
              {about.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
