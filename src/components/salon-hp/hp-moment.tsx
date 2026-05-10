"use client";

import { useEffect, useRef } from "react";

type Props = {
  moment: {
    eyebrow?: string;
    headline: string;
    body: string;
    image_path: string;
  };
};

/** Claude Design: 90vh 全面写真 + パララックス */
export function HpMoment({ moment }: Props) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const bg = bgRef.current;
        if (!bg || !bg.parentElement) return;
        const r = bg.parentElement.getBoundingClientRect();
        const v = r.top / window.innerHeight;
        bg.style.transform = `translateY(${v * -40}px) scale(1.06)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      className="relative h-[90vh] min-h-[560px] overflow-hidden my-20 sei-dark-section"
    >
      <div
        ref={bgRef}
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage: `url(${moment.image_path})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(0.85) brightness(0.96)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 60%)",
        }}
      />
      <div className="absolute left-[6vw] top-1/2 -translate-y-1/2 z-[2] text-white max-w-[540px]">
        <span className="head-en reveal text-white/85 block">
          {moment.eyebrow ?? "MOMENT"}
        </span>
        <h2
          className="reveal font-serif-en italic font-light leading-[1.25] text-white my-4"
          style={{ fontSize: "clamp(36px, 5vw, 68px)" }}
        >
          {moment.headline}
        </h2>
        <p className="reveal font-serif-jp text-[13px] tracking-[0.18em] leading-[2.2] text-white/85 mt-4 max-w-[480px] whitespace-pre-line">
          {moment.body}
        </p>
      </div>
    </section>
  );
}
