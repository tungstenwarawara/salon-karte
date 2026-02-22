"use client";

import { formatYen, getFilteredTotal, filterColor } from "@/components/sales/sales-types";
import type { MonthlySales, DailySales, CategoryFilter } from "@/components/sales/sales-types";

type Props = {
  drillMonth: number;
  data: MonthlySales[];
  drillData: DailySales[];
  drillLoading: boolean;
  categoryFilter: CategoryFilter;
  onClose: () => void;
};

function getDrillTotal(d: DailySales, filter: CategoryFilter): number {
  if (filter === "treatment") return d.treatment;
  if (filter === "product") return d.product;
  if (filter === "ticket") return d.ticket;
  return d.treatment + d.product + d.ticket;
}

/** 日別売上ドリルダウンパネル */
export function SalesDrilldown({ drillMonth, data, drillData, drillLoading, categoryFilter, onClose }: Props) {
  const m = data.find((d) => d.month === drillMonth);
  const monthTotal = m ? getFilteredTotal(m, categoryFilter) : 0;
  const drillMax = Math.max(...drillData.map((d) => getDrillTotal(d, categoryFilter)), 1);

  const cashTotal = drillData.reduce((s, d) => s + d.cash, 0);
  const creditTotal = drillData.reduce((s, d) => s + d.credit, 0);
  const showCashCredit = (categoryFilter === "all" || categoryFilter === "treatment") && (cashTotal > 0 || creditTotal > 0);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">{drillMonth}月 日別内訳</h3>
            <span className="text-xs text-text-light">{formatYen(monthTotal)}</span>
          </div>
          {showCashCredit && (
            <p className="text-[10px] text-text-light mt-0.5">
              現金 {formatYen(cashTotal)} / カード {formatYen(creditTotal)}
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-xs text-text-light hover:text-text">閉じる</button>
      </div>

      {drillLoading ? (
        <div className="text-center text-text-light text-sm py-4">読み込み中...</div>
      ) : (
        <div className="space-y-1">
          {drillData.filter((d) => getDrillTotal(d, categoryFilter) > 0).map((d) => {
            const total = getDrillTotal(d, categoryFilter);
            const barWidth = drillMax > 0 ? (total / drillMax) * 100 : 0;
            return (
              <div key={d.day} className="flex items-center gap-2">
                <span className="text-xs text-text-light tabular-nums w-7 shrink-0 text-right">{d.day}日</span>
                <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${filterColor(categoryFilter)} opacity-60`}
                    style={{ width: `${barWidth}%` }} />
                </div>
                <span className="text-xs font-medium tabular-nums shrink-0 w-20 text-right">{formatYen(total)}</span>
              </div>
            );
          })}
          {drillData.every((d) => getDrillTotal(d, categoryFilter) === 0) && (
            <p className="text-sm text-text-light text-center py-2">この月のデータはありません</p>
          )}
        </div>
      )}
    </div>
  );
}
