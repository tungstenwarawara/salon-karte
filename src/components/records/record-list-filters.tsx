"use client";

export type PeriodFilter = "yesterday" | "today" | "tomorrow" | "all";

type Props = {
  period: PeriodFilter;
  onPeriodChange: (p: PeriodFilter) => void;
};

export function RecordListFilters({ period, onPeriodChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {([
        ["yesterday", "昨日"],
        ["today", "今日"],
        ["tomorrow", "明日"],
        ["all", "全期間"],
      ] as [PeriodFilter, string][]).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onPeriodChange(key)}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors min-h-[44px] ${
            period === key
              ? "bg-accent text-white"
              : "bg-surface border border-border text-text-light"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
