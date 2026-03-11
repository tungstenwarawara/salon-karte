"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

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

    // ヒーロー通過を検知
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroLeft = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0 }
    );

    // BookingCTA到達を検知
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
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white/95 backdrop-blur-xl border-t border-[#E8E0D8]/60 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto px-4 py-3 text-center">
          <Link
            href={`/book/${bookingSlug}`}
            className="block bg-[#C4956A] hover:bg-[#B8875E] text-white font-bold rounded-full py-3.5 text-sm transition-all duration-300 hp-cta-glow"
          >
            今すぐ予約する
          </Link>
          <p className="text-[10px] text-gray-400 mt-1.5 tracking-wide">
            24時間受付 ・ キャンセル無料
          </p>
        </div>
      </div>
    </div>
  );
}
