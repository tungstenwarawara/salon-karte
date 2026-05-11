"use client";

import type { RecordType } from "./types";
import { RECORD_TYPE_LABELS } from "./types";

type Props = {
  value: RecordType;
  onChange: (type: RecordType) => void;
};

const ORDER: RecordType[] = ["visit", "product_only", "cancelled", "memo"];

export function RecordTypeTabs({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">記録の種類</label>
      <div className="grid grid-cols-4 gap-1.5">
        {ORDER.map((t) => {
          const active = t === value;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              className={`text-[13px] sm:text-sm font-medium rounded-xl py-2.5 px-1 min-h-[44px] whitespace-nowrap transition-colors border ${
                active
                  ? "bg-accent border-accent text-white"
                  : "bg-background border-border text-text-light hover:border-accent/50"
              }`}
              aria-pressed={active}
            >
              {RECORD_TYPE_LABELS[t]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
