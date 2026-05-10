"use client";

import { useEffect } from "react";

/**
 * IntersectionObserver で .reveal / .reveal-img に .in を付与
 * 各セクションが viewport に入ったタイミングで CSS アニメーション発火
 */
export function HpRevealController() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -80px 0px" }
    );

    document
      .querySelectorAll(".reveal, .reveal-img")
      .forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
