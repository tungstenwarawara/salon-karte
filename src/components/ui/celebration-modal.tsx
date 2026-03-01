"use client";

import { useEffect, useState } from "react";
import { Confetti } from "./confetti";

type CelebrationModalProps = {
  title: string;
  message: string;
  onClose: () => void;
  autoCloseMs?: number;
};

export function CelebrationModal({
  title,
  message,
  onClose,
  autoCloseMs = 5000,
}: CelebrationModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [autoCloseMs, onClose]);

  return (
    <>
      <Confetti />
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          visible ? "bg-text/20 backdrop-blur-sm" : "bg-transparent"
        }`}
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
      >
        <div
          className={`bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl text-center space-y-4 transition-all duration-300 ${
            visible ? "animate-scale-in" : "opacity-0 scale-95"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* SVGチェックマークアニメーション */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8 text-success"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M5 13l4 4L19 7"
                  style={{
                    strokeDasharray: 56,
                    strokeDashoffset: 56,
                    animation: "draw-check 0.6s ease-out 0.3s forwards",
                  }}
                />
              </svg>
            </div>
          </div>

          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-text-light">{message}</p>

          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 300);
            }}
            className="bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-2.5 transition-colors min-h-[44px]"
          >
            閉じる
          </button>
        </div>
      </div>
    </>
  );
}
