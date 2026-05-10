"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

/** NANA系: 重い塗りボタンでなく細枠ボタンを下から薄くスライドイン */
export function HpStickyCta({ bookingSlug, bookingEnabled }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-section");
    const bookingCta = document.getElementById("booking-cta");
    if (!hero || !bookingCta) return;

    let heroLeft = true;
    let bookingCtaVisible = false;

    const updateVisibility = () => {
      setVisible(!heroLeft && !bookingCtaVisible);
    };

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroLeft = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0 }
    );

    const ctaObserver = new IntersectionObserver(
      ([entry]) => {
        bookingCtaVisible = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0 }
    );

    heroObserver.observe(hero);
    ctaObserver.observe(bookingCta);

    return () => {
      heroObserver.disconnect();
      ctaObserver.disconnect();
    };
  }, []);

  if (!bookingEnabled || !bookingSlug) return null;

  return (
    <div
      className={`fixed bottom-4 left-0 right-0 z-40 transition-all duration-500 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-sm mx-auto px-4 text-center">
        <Link
          href={`/book/${bookingSlug}`}
          className="group inline-flex items-center justify-center gap-3 w-full bg-[#FAF6F0]/95 backdrop-blur-md border border-[#9B7A52] text-[#9B7A52] hover:bg-[#9B7A52] hover:text-white tracking-[0.3em] text-xs uppercase py-4 transition-all duration-300 shadow-[0_4px_20px_rgba(155,122,82,0.15)]"
        >
          <span className="w-5 h-px bg-current" />
          Reserve
          <svg
            className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
