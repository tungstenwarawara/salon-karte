"use client";

import { useState } from "react";

type Props = {
  children: React.ReactNode;
};

/** ?アイコン → タップで説明を表示するヘルプ吹き出し */
export function HelpTip({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full bg-border/60 text-text-light text-[11px] font-bold inline-flex items-center justify-center hover:bg-border transition-colors before:absolute before:inset-[-12px] before:content-['']"
        aria-label="ヘルプ"
      >
        ?
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="閉じる"
          />
          <div className="absolute left-0 top-7 z-50 w-64 bg-surface border border-border rounded-xl p-3 shadow-lg text-xs text-text-light leading-relaxed">
            {children}
          </div>
        </>
      )}
    </span>
  );
}
