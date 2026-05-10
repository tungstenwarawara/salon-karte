"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  salonName: string;
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

/**
 * NANA系のミニマルヘッダー:
 *  - 最初は透過（背景色に同化）
 *  - スクロール 400px 以降でクリーム背景＋細罫線でフェードイン
 *  - サロン名: 細セリフ・大文字
 *  - CTA: 重い塗りボタンを廃止、テキストリンク + em-dash 装飾
 */
export function HpHeader({ salonName, bookingSlug, bookingEnabled }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 80);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#E5DBCB]/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-10 h-14 md:h-16 flex items-center justify-between">
        <Link
          href="#hero-section"
          className="text-[11px] md:text-xs tracking-[0.4em] text-gray-700 uppercase font-light"
          style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
        >
          {salonName}
        </Link>
        {bookingEnabled && bookingSlug && (
          <Link
            href={`/book/${bookingSlug}`}
            className="group inline-flex items-center gap-2 text-[10px] md:text-xs tracking-[0.25em] text-[#9B7A52] uppercase hover:text-gray-900 transition-colors"
          >
            <span className="hidden md:inline-block w-6 h-px bg-current" />
            Reserve
            <svg
              className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
