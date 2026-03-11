"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  salonName: string;
  bookingSlug: string | null;
  bookingEnabled: boolean;
};

export function HpHeader({ salonName, bookingSlug, bookingEnabled }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setVisible(window.scrollY > 400);
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white/95 backdrop-blur-xl border-b border-[#E8E0D8]/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-sm tracking-[0.15em] text-gray-800">
            {salonName}
          </span>
          {bookingEnabled && bookingSlug && (
            <Link
              href={`/book/${bookingSlug}`}
              className="bg-[#C4956A] hover:bg-[#B8875E] text-white text-sm font-bold rounded-full px-6 py-2.5 transition-all duration-200 min-h-[44px] flex items-center shadow-sm"
            >
              予約する
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
