import type { SalonHpContent } from "@/types/database";

type Props = {
  hero: SalonHpContent["hero"];
  brandMark: string;
};

/**
 * Claude Design v3: Full-bleed cinematic hero
 * - 背景画像 + Ken Burns
 * - 左下にブランドマーク + 1文字ずつ rise アニメーション
 * - 左中央に "No.01 Welcome — Ginza · Tokyo"
 * - 右下に縦書き "SCROLL" + パルスライン
 */
export function HpHero({ hero, brandMark }: Props) {
  const headline = hero.headline || brandMark;
  return (
    <section
      id="top"
      className="relative h-screen min-h-[640px] overflow-hidden bg-[#1a1a18] sei-dark-section"
    >
      {/* Background image with Ken Burns */}
      {hero.image_path && (
        <div
          className="absolute inset-0 hero-bg"
          style={{
            backgroundImage: `url(${hero.image_path})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Top + bottom gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.05) 60%, rgba(20,18,15,0.45) 100%)",
        }}
      />

      {/* Hero meta (left middle) */}
      <div className="hero-meta-fadein absolute left-[5vw] top-1/2 -translate-y-1/2 z-[2] text-white">
        <span className="font-serif-en italic text-sm tracking-[0.2em] opacity-85">
          No. 01 — Welcome
        </span>
        <span className="block w-px h-9 bg-white/50 my-3" />
        <span className="font-sans-en text-[10px] tracking-[0.35em] uppercase opacity-85">
          Ginza · Tokyo
        </span>
      </div>

      {/* Hero brand mark (left bottom) */}
      <div className="absolute left-[5vw] bottom-[10vh] z-[2] text-white">
        <span className="block overflow-hidden mb-6">
          <span className="hero-rise-lead block font-sans-en text-[10px] tracking-[0.55em] uppercase opacity-85">
            Bust care studio · Ginza
          </span>
        </span>
        <span
          className="block font-serif-en italic font-light leading-[0.9] tracking-[0.02em]"
          style={{ fontSize: "clamp(80px, 12vw, 180px)" }}
          aria-label={brandMark}
        >
          {[...headline].map((ch, i) => (
            <span
              key={i}
              className="hero-rise"
              style={{ animationDelay: `${0.6 + i * 0.08}s` }}
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
        <span className="block mt-5 overflow-hidden">
          <span className="hero-rise-sub block font-serif-jp text-[12px] md:text-[13px] tracking-[0.45em]">
            {hero.subheadline}
          </span>
        </span>
      </div>

      {/* Scroll indicator (right bottom) */}
      <div
        className="hero-fadein absolute right-[5vw] bottom-[8vh] z-[2] text-white font-sans-en text-[10px] tracking-[0.5em] uppercase flex items-center gap-3.5"
        style={{ writingMode: "vertical-rl" }}
      >
        SCROLL
        <span
          className="scroll-pulse w-px h-16"
          style={{
            background:
              "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0) 100%)",
          }}
        />
      </div>
    </section>
  );
}
