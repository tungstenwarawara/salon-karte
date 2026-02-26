"use client";

export type PeriodFilter = "this_month" | "last_month" | "3months" | "all";

type Props = {
  period: PeriodFilter;
  onPeriodChange: (p: PeriodFilter) => void;
};

export function RecordListFilters({ period, onPeriodChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {([
        ["this_month", "今月"],
        ["last_month", "先月"],
        ["3months", "3ヶ月"],
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
