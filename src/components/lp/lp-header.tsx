"use client";

/** 固定CTAヘッダー — スクロール600px以降で表示 */

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CtaLink } from "./cta-link";

export function LpHeader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white/90 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="#" aria-label="トップに戻る">
            <BrandLogo size="sm" />
          </a>
          <CtaLink
            href="/signup"
            trackingLocation="sticky_header"
            trackingLabel="無料ではじめる"
            className="bg-accent hover:bg-accent-light text-white text-sm font-bold rounded-xl px-5 py-2 transition-colors min-h-[44px] flex items-center"
          >
            無料ではじめる
          </CtaLink>
        </div>
      </div>
    </header>
  );
}
