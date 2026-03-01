"use client";

import { useState, useEffect } from "react";
import { useFirstVisit } from "@/lib/hooks/use-first-visit";

type FirstVisitHintProps = {
  pageKey: string;
  message: string;
  autoFadeMs?: number;
};

export function FirstVisitHint({
  pageKey,
  message,
  autoFadeMs = 10000,
}: FirstVisitHintProps) {
  const { isFirstVisit, markVisited } = useFirstVisit(`hint_${pageKey}`);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!isFirstVisit) return;
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => markVisited(), 500);
    }, autoFadeMs);
    return () => clearTimeout(timer);
  }, [isFirstVisit, autoFadeMs, markVisited]);

  if (!isFirstVisit) return null;

  return (
    <div
      className={`bg-accent/5 border border-accent/20 rounded-xl px-3 py-2.5 flex items-center gap-2 ${
        fading ? "animate-hint-fade-out" : "animate-fade-in-up"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4 text-accent shrink-0"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-xs text-text flex-1">{message}</p>
      <button
        onClick={() => {
          setFading(true);
          setTimeout(() => markVisited(), 500);
        }}
        className="text-text-light hover:text-text p-1 shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center"
        aria-label="閉じる"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}
