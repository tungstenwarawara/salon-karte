import type { SalonHpContent } from "@/types/database";

type Props = {
  salonName: string;
  links: SalonHpContent["links"];
};

/** NANA系: 黒背景でなくクリーム継承、中央寄せシンプルフッター */
export function HpFooter({ salonName, links }: Props) {
  // Instagram URL正規化
  let instaUrl: string | null = null;
  if (links.instagram) {
    const t = links.instagram.trim();
    instaUrl = t.startsWith("http") ? t : `https://instagram.com/${t.replace(/^@/, "")}`;
  }

  return (
    <footer className="bg-[#FAF6F0] border-t border-[#E5DBCB]/60">
      <div className="max-w-3xl mx-auto px-5 md:px-10 py-16 md:py-20">
        <div className="flex flex-col items-center gap-8">
          <p
            className="text-sm tracking-[0.4em] text-gray-700 font-light uppercase"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            {salonName}
          </p>

          {/* SNS / リンク群 */}
          <div className="flex items-center gap-6 text-[10px] tracking-[0.3em] text-gray-500 uppercase">
            {instaUrl && (
              <a
                href={instaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#9B7A52] transition-colors"
              >
                Instagram
              </a>
            )}
            {links.line_url && (
              <>
                <span className="text-gray-300">·</span>
                <a
                  href={links.line_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#9B7A52] transition-colors"
                >
                  LINE
                </a>
              </>
            )}
            {links.website && (
              <>
                <span className="text-gray-300">·</span>
                <a
                  href={links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#9B7A52] transition-colors"
                >
                  HotPepper
                </a>
              </>
            )}
          </div>

          <span className="w-12 h-px bg-[#9B7A52]/30" />

          <p className="text-[10px] tracking-[0.2em] text-gray-400">
            &copy; {new Date().getFullYear()} {salonName}
          </p>

          <p className="text-[9px] tracking-[0.15em] text-gray-300">
            Powered by{" "}
            <a
              href="https://salonkarte.com"
              className="hover:text-[#9B7A52] transition-colors"
            >
              Salon Karte
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
