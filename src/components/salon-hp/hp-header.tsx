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
      <div className="bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-sm tracking-wider text-gray-800">
            {salonName}
          </span>
          {bookingEnabled && bookingSlug && (
            <Link
              href={`/book/${bookingSlug}`}
              className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full px-5 py-2 transition-colors min-h-[44px] flex items-center"
            >
              予約する
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
