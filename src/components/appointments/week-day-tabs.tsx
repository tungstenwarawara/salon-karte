"use client";

import { DAY_SHORT_LABELS, DAY_KEY_MAP } from "@/lib/business-hours";

type Props = {
  dates: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  appointmentCounts: number[];
  todayStr: string;
};

/** 複数スタッフ時の曜日タブバー */
export function WeekDayTabs({ dates, selectedIndex, onSelect, appointmentCounts, todayStr }: Props) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {dates.map((dateStr, i) => {
        const d = new Date(dateStr + "T00:00:00");
        const dayKey = DAY_KEY_MAP[d.getDay()];
        const dayLabel = DAY_SHORT_LABELS[dayKey];
        const dayNum = d.getDate();
        const isToday = dateStr === todayStr;
        const isActive = i === selectedIndex;
        const count = appointmentCounts[i] ?? 0;
        const isSunday = d.getDay() === 0;
        const isSaturday = d.getDay() === 6;

        return (
          <button
            key={dateStr}
            onClick={() => onSelect(i)}
            className={`flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-xl text-xs transition-colors min-h-[48px] min-w-[48px] ${
              isActive
                ? "bg-accent text-white"
                : isToday
                  ? "bg-surface border-2 border-accent"
                  : "bg-surface border border-border"
            }`}
          >
            <span className={isActive ? "text-white/80" : isSunday ? "text-red-500" : isSaturday ? "text-blue-500" : "text-text-light"}>
              {dayLabel}
            </span>
            <span className={`text-sm font-medium ${isActive ? "text-white" : ""}`}>{dayNum}</span>
            {count > 0 && (
              <span className={`text-[10px] ${isActive ? "text-white/70" : "text-text-light"}`}>{count}件</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
