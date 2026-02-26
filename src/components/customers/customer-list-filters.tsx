"use client";

export type SortKey = "kana" | "last_visit" | "visit_count";
export type VisitFilter = "all" | "30" | "60" | "90";

type Props = {
  visitFilter: VisitFilter;
  onVisitFilterChange: (f: VisitFilter) => void;
  sortBy: SortKey;
  onSortChange: (s: SortKey) => void;
  hideGraduated: boolean;
  onHideGraduatedChange: (v: boolean) => void;
  graduatedCount: number;
};

export function CustomerListFilters({
  visitFilter,
  onVisitFilterChange,
  sortBy,
  onSortChange,
  hideGraduated,
  onHideGraduatedChange,
  graduatedCount,
}: Props) {
  return (
    <div className="space-y-2">
      {/* 来店間隔フィルター */}
      <div className="flex gap-2 flex-wrap">
        {([
          ["all", "全員"],
          ["30", "30日以上"],
          ["60", "60日以上"],
          ["90", "90日以上"],
        ] as [VisitFilter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onVisitFilterChange(key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors min-h-[44px] ${
              visitFilter === key
                ? "bg-accent text-white"
                : "bg-surface border border-border text-text-light"
            }`}
          >
            {key === "all" ? label : `${label}未来店`}
          </button>
        ))}
      </div>

      {/* ソート + 卒業済み除外 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {([
            ["kana", "カナ順"],
            ["last_visit", "来店日順"],
            ["visit_count", "来店回数"],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onSortChange(key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors min-h-[44px] ${
                sortBy === key
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-text-light"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {graduatedCount > 0 && (
          <button
            onClick={() => onHideGraduatedChange(!hideGraduated)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors min-h-[44px] whitespace-nowrap ${
              hideGraduated
                ? "bg-surface border border-border text-text-light"
                : "bg-orange-100 border border-orange-300 text-orange-700"
            }`}
          >
            {hideGraduated ? "卒業済みを表示" : `卒業済み含む(${graduatedCount})`}
          </button>
        )}
      </div>
    </div>
  );
}
