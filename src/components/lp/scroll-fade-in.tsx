"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right";

interface ScrollFadeInProps {
  children: ReactNode;
  /** アニメーション方向（デフォルト: up） */
  direction?: Direction;
  /** 遅延 ms（デフォルト: 0） */
  delay?: number;
  /** アニメーション時間 ms（デフォルト: 600） */
  duration?: number;
  /** 移動距離 px（デフォルト: 32） */
  distance?: number;
  /** className の追加 */
  className?: string;
}

const directionMap: Record<Direction, string> = {
  up: "translateY(VALpx)",
  down: "translateY(-VALpx)",
  left: "translateX(VALpx)",
  right: "translateX(-VALpx)",
};

// 共有IntersectionObserver（全ScrollFadeInインスタンスで1つだけ生成）
let sharedObserver: IntersectionObserver | null = null;
const callbacks = new Map<Element, () => void>();

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = callbacks.get(entry.target);
            if (cb) {
              cb();
              callbacks.delete(entry.target);
              sharedObserver!.unobserve(entry.target);
            }
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
  }
  return sharedObserver;
}

export function ScrollFadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 600,
  distance = 32,
  className = "",
}: ScrollFadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = getSharedObserver();

    callbacks.set(el, () => {
      el.style.opacity = "1";
      el.style.transform = "translate(0, 0)";
      const cleanup = () => {
        el.style.willChange = "auto";
        el.removeEventListener("transitionend", cleanup);
      };
      el.addEventListener("transitionend", cleanup);
    });

    observer.observe(el);
    return () => {
      observer.unobserve(el);
      callbacks.delete(el);
    };
  }, []);

  const initialTransform = directionMap[direction].replace(
    "VAL",
    String(distance),
  );

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: initialTransform,
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
