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
      {/* 来店間隔フィルター（横スクロール・ピル型） */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
        {([
          ["all", "全員"],
          ["30", "30日+"],
          ["60", "60日+"],
          ["90", "90日+"],
        ] as [VisitFilter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onVisitFilterChange(key)}
            className={`text-xs px-3.5 py-2 rounded-full transition-colors min-h-[44px] whitespace-nowrap shrink-0 ${
              visitFilter === key
                ? "bg-accent text-white"
                : "bg-surface border border-border text-text-light"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ソート（セグメンテッドコントロール） + 卒業済み除外 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-background rounded-lg p-0.5">
          {([
            ["kana", "カナ順"],
            ["last_visit", "来店日"],
            ["visit_count", "回数"],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onSortChange(key)}
              className={`text-xs px-2.5 py-1.5 rounded-md transition-colors min-h-[40px] ${
                sortBy === key
                  ? "bg-surface text-text font-medium shadow-sm"
                  : "text-text-light"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {graduatedCount > 0 && (
          <button
            onClick={() => onHideGraduatedChange(!hideGraduated)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors min-h-[44px] whitespace-nowrap shrink-0 ${
              hideGraduated
                ? "bg-surface border border-border text-text-light"
                : "bg-orange-100 border border-orange-300 text-orange-700"
            }`}
          >
            {hideGraduated ? `卒業 ${graduatedCount}` : "卒業含む"}
          </button>
        )}
      </div>
    </div>
  );
}
