import type { SalonHpContent } from "@/types/database";

type Props = {
  salonName: string;
  brandMark: string;
  brandSummary?: string;
  links: SalonHpContent["links"];
};

/** Claude Design: 4カラムフッター + bottom bar */
export function HpFooter({ salonName, brandMark, brandSummary, links }: Props) {
  // Instagram URL正規化
  let instaUrl: string | null = null;
  if (links.instagram) {
    const t = links.instagram.trim();
    instaUrl = t.startsWith("http") ? t : `https://instagram.com/${t.replace(/^@/, "")}`;
  }

  const summary = brandSummary ?? `${salonName}。完全女性スタッフ・完全個室・完全予約制。`;

  return (
    <footer className="px-[5vw] pt-20 pb-9 bg-[color:var(--bg)] border-t border-[color:var(--line)]">
      <div className="max-w-[1180px] mx-auto grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-12 pb-14 border-b border-[color:var(--line)]">
        <div className="col-span-2 md:col-span-1">
          <div className="font-serif-en italic font-light text-4xl tracking-[0.18em]">
            {brandMark}
          </div>
          <p className="text-xs text-[color:var(--ink-soft)] leading-[2.1] max-w-[320px] mt-6 whitespace-pre-line">
            {summary}
          </p>
        </div>
        <div>
          <h5 className="font-sans-en font-normal text-[11px] tracking-[0.4em] uppercase mt-1.5 mb-5">
            Site
          </h5>
          <ul className="list-none p-0 m-0 flex flex-col gap-3 text-xs text-[color:var(--ink-soft)] tracking-[0.16em]">
            <li><a href="#concept" className="hover:text-[color:var(--accent)] transition-colors">Concept</a></li>
            <li><a href="#menu" className="hover:text-[color:var(--accent)] transition-colors">Menu</a></li>
            <li><a href="#journey" className="hover:text-[color:var(--accent)] transition-colors">Journey</a></li>
            <li><a href="#voice" className="hover:text-[color:var(--accent)] transition-colors">Voice</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-sans-en font-normal text-[11px] tracking-[0.4em] uppercase mt-1.5 mb-5">
            Info
          </h5>
          <ul className="list-none p-0 m-0 flex flex-col gap-3 text-xs text-[color:var(--ink-soft)] tracking-[0.16em]">
            <li><a href="#access" className="hover:text-[color:var(--accent)] transition-colors">Access</a></li>
            <li><a href="#faq" className="hover:text-[color:var(--accent)] transition-colors">FAQ</a></li>
            {links.website && (
              <li>
                <a
                  href={links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[color:var(--accent)] transition-colors"
                >
                  HotPepper
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h5 className="font-sans-en font-normal text-[11px] tracking-[0.4em] uppercase mt-1.5 mb-5">
            Follow
          </h5>
          <ul className="list-none p-0 m-0 flex flex-col gap-3 text-xs text-[color:var(--ink-soft)] tracking-[0.16em]">
            {instaUrl && (
              <li>
                <a
                  href={instaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[color:var(--accent)] transition-colors"
                >
                  Instagram
                </a>
              </li>
            )}
            {links.line_url && (
              <li>
                <a
                  href={links.line_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[color:var(--accent)] transition-colors"
                >
                  LINE
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto pt-8 flex flex-wrap justify-between gap-3 font-sans-en text-[10px] tracking-[0.3em] uppercase text-[color:var(--ink-mute)]">
        <span>© {new Date().getFullYear()} {brandMark}</span>
        <span>Ginza · Tokyo</span>
      </div>

      <div className="max-w-[1180px] mx-auto mt-4 text-center font-sans-en text-[9px] tracking-[0.2em] uppercase text-[color:var(--ink-mute)]/60">
        Powered by{" "}
        <a href="https://salonkarte.com" className="hover:text-[color:var(--accent)] transition-colors">
          Salon Karte
        </a>
      </div>
    </footer>
  );
}
