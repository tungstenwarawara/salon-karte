"use client";

import { formatYen, getFilteredTotal, filterColor } from "@/components/sales/sales-types";
import type { MonthlySales, CategoryFilter } from "@/components/sales/sales-types";

type Props = {
  visibleData: MonthlySales[];
  categoryFilter: CategoryFilter;
  maxMonthly: number;
  currentMonth: number;
  currentYear: number;
  year: number;
  drillMonth: number | null;
  onDrillToggle: (month: number | null) => void;
};

/** 月別売上の縦棒グラフ */
export function SalesBarChart({ visibleData, categoryFilter, maxMonthly, currentMonth, currentYear, year, drillMonth, onDrillToggle }: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">月別推移</h3>
        <span className="text-[10px] text-text-light">{formatYen(maxMonthly)}</span>
      </div>

      {/* チャートエリア */}
      <div className="relative" style={{ height: "160px" }}>
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[1, 0.5, 0].map((ratio) => (
            <div key={ratio} className="flex items-center gap-1">
              <div className="flex-1 border-t border-dashed border-border/30" />
            </div>
          ))}
        </div>

        <div className="relative h-full flex items-end gap-1">
          {visibleData.map((m) => {
            const total = getFilteredTotal(m, categoryFilter);
            const barHeight = maxMonthly > 0 ? Math.round((total / maxMonthly) * 148) : 0;
            const isCurrentMonth = m.month - 1 === currentMonth && year === currentYear;
            const isDrilling = drillMonth === m.month;

            return (
              <button key={m.month} onClick={() => onDrillToggle(drillMonth === m.month ? null : m.month)}
                className="flex-1 relative group" style={{ height: "100%" }}>
                <div className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500 ${
                  isDrilling ? filterColor(categoryFilter)
                    : isCurrentMonth ? `${filterColor(categoryFilter)} opacity-90`
                    : `${filterColor(categoryFilter)} opacity-30 group-hover:opacity-60`
                }`} style={{ height: `${barHeight}px`, minHeight: total > 0 ? "4px" : "0" }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 月ラベル */}
      <div className="flex gap-1">
        {visibleData.map((m) => {
          const isDrilling = drillMonth === m.month;
          const isCurrentMonth = m.month - 1 === currentMonth && year === currentYear;
          const total = getFilteredTotal(m, categoryFilter);
          return (
            <div key={m.month} className="flex-1 text-center">
              {isDrilling && <div className="text-[9px] font-bold text-accent truncate">{formatYen(total)}</div>}
              <span className={`text-[10px] ${isDrilling ? "text-accent font-bold" : isCurrentMonth ? "font-bold text-text" : "text-text-light"}`}>
                {m.month}月
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
