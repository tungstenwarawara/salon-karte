"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type Props = {
  brandMark: string;
  brandSub: string;
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

/**
 * NANA / Claude Design 系の永続UI:
 *  - 左上 corner-logo (mix-blend-mode: difference で白/黒切替)
 *  - 右上 corner-menu (44pxの円形)
 *  - 右下 sticky-cta dot (96pxの黒円・点線リング)
 *  - 右端 scroll progress (1pxライン)
 *
 * クライアントサイドで scroll & elementFromPoint で
 * 暗背景セクション上ではロゴを白、明背景では黒に自動切替
 */
export function HpCornerUi({ brandMark, brandSub, bookingSlug, bookingEnabled }: Props) {
  const logoRef = useRef<HTMLAnchorElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        if (progressRef.current) {
          progressRef.current.style.setProperty("--p", pct + "%");
        }
        // logo color invert based on dark sections
        const logo = logoRef.current;
        const sec = document.elementFromPoint(80, 60);
        if (logo && sec) {
          const dark = sec.closest(".sei-dark-section");
          logo.classList.toggle("sei-invert", !dark);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Scroll progress (right edge) */}
      <div
        ref={progressRef}
        className="fixed right-3 top-0 bottom-0 w-px z-[70] pointer-events-none"
        aria-hidden="true"
        style={{ ['--p' as string]: '0%' }}
      >
        <span className="absolute left-0 top-0 bottom-0 w-px bg-[color:var(--line)]" />
        <span
          className="absolute left-0 top-0 w-px bg-[color:var(--ink)] transition-[height] duration-100"
          style={{ height: 'var(--p)' }}
        />
      </div>

      {/* Corner logo (top-left) */}
      <Link
        ref={logoRef}
        href="#top"
        className="fixed left-6 md:left-8 top-6 md:top-8 z-[60] text-white sei-corner-logo"
      >
        <span className="block font-serif-en italic font-light text-[26px] md:text-[32px] tracking-[0.18em] leading-none mb-1">
          {brandMark}
        </span>
        <span className="block font-sans-en font-normal text-[10px] tracking-[0.5em] uppercase opacity-90">
          {brandSub}
        </span>
      </Link>

      {/* Corner menu (top-right) */}
      <button
        className="fixed right-6 md:right-8 top-5 md:top-7 z-[60] w-11 h-11 rounded-full border border-current grid place-items-center text-white sei-corner-menu"
        aria-label="メニューを開く"
      >
        <span className="relative block w-4 h-px bg-current">
          <span className="absolute -top-[5px] left-0 w-4 h-px bg-current" />
          <span className="absolute top-[5px] left-0 w-4 h-px bg-current" />
        </span>
      </button>

      {/* Sticky CTA dot (bottom-right) */}
      {bookingEnabled && bookingSlug && (
        <Link
          href={`/book/${bookingSlug}`}
          className="sticky-cta-dot fixed right-6 md:right-7 bottom-6 md:bottom-7 z-[65] w-[88px] h-[88px] md:w-24 md:h-24 rounded-full bg-[color:var(--ink)] text-[color:var(--bg)] grid place-items-center text-center font-sans-en text-[10px] tracking-[0.3em] uppercase shadow-[0_12px_40px_rgba(0,0,0,0.18)] group"
          aria-label="予約する"
        >
          <span className="absolute -inset-[10px] rounded-full border border-dashed border-white/35 transition-transform duration-[1400ms] group-hover:rotate-180" />
          <span className="relative">
            Reserve
            <br />
            <span className="block text-[18px] mt-0.5 font-serif-en">→</span>
          </span>
        </Link>
      )}

      {/* mix-blend-mode の制御CSSをinline (Tailwindで完全に表現できないため) */}
      <style>{`
        .sei-corner-logo {
          mix-blend-mode: difference;
        }
        .sei-corner-logo.sei-invert {
          mix-blend-mode: normal;
          color: var(--ink);
        }
        .sei-corner-menu {
          mix-blend-mode: difference;
        }
      `}</style>
    </>
  );
}
