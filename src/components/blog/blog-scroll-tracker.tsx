"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  slug: string;
  title: string;
};

/** ブログ記事のスクロール75%到達を検知して blog_read イベントを送信 */
export function BlogScrollTracker({ slug, title }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (firedRef.current) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = scrollTop / docHeight;
      if (scrollPercent >= 0.75) {
        firedRef.current = true;
        trackEvent({ name: "blog_read", params: { slug, title } });
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug, title]);

  return null;
}
