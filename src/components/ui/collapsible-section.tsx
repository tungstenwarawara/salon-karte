"use client";

import { useState } from "react";

type CollapsibleSectionProps = {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleSection({ label, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-medium text-text-light min-h-[44px] px-1"
      >
        <span>{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-[2000px] opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
