"use client";

import { formatYen, getChangePercent, getFilteredTotal, filterColor } from "@/components/sales/sales-types";
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

/** 月別サマリーリスト */
export function SalesMonthlyList({ visibleData, categoryFilter, maxMonthly, currentMonth, currentYear, year, drillMonth, onDrillToggle }: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
      <h3 className="font-bold text-sm">月別サマリー</h3>
      {visibleData.map((m, idx) => {
        const total = getFilteredTotal(m, categoryFilter);
        const prevTotal = idx > 0 ? getFilteredTotal(visibleData[idx - 1], categoryFilter) : 0;
        const change = idx > 0 ? getChangePercent(total, prevTotal) : null;
        const isCurrentMonth = m.month - 1 === currentMonth && year === currentYear;

        return (
          <button key={m.month} onClick={() => onDrillToggle(drillMonth === m.month ? null : m.month)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
              drillMonth === m.month ? "bg-accent/5 border border-accent/20" : "hover:bg-background"
            }`}>
            <span className={`text-xs font-medium w-8 shrink-0 ${isCurrentMonth ? "text-accent font-bold" : ""}`}>{m.month}月</span>
            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden flex">
              {categoryFilter === "all" ? (
                <>
                  {m.treatment_sales > 0 && <div className="bg-accent h-full" style={{ width: `${maxMonthly > 0 ? (m.treatment_sales / maxMonthly) * 100 : 0}%` }} />}
                  {m.product_sales > 0 && <div className="bg-blue-400 h-full" style={{ width: `${maxMonthly > 0 ? (m.product_sales / maxMonthly) * 100 : 0}%` }} />}
                  {m.ticket_sales > 0 && <div className="bg-amber-400 h-full" style={{ width: `${maxMonthly > 0 ? (m.ticket_sales / maxMonthly) * 100 : 0}%` }} />}
                </>
              ) : (
                <div className={`h-full ${filterColor(categoryFilter)} opacity-60`}
                  style={{ width: `${maxMonthly > 0 ? (total / maxMonthly) * 100 : 0}%` }} />
              )}
            </div>
            <span className="text-xs font-bold tabular-nums shrink-0 w-20 text-right">{formatYen(total)}</span>
            {change && <span className={`text-[10px] font-medium shrink-0 w-10 text-right ${change.color}`}>{change.text}</span>}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-text-light shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
