"use client";

import { formatYen } from "@/components/sales/sales-types";
import type { DailyTotals } from "./daily-ledger-types";
import { formatDateLabel } from "./daily-ledger-types";

type Props = {
  date: string;
  totals: DailyTotals;
};

export function DailySummaryCard({ date, totals }: Props) {
  const { total, cash, credit, ticket, service, treatmentTotal, purchaseTotal, ticketPurchaseTotal } = totals;
  const revenueTotal = treatmentTotal + purchaseTotal + ticketPurchaseTotal;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-sm text-text-light">{formatDateLabel(date)}</span>
          <span className="text-xs text-text-light ml-2">来店 {totals.customerCount}名</span>
        </div>
        <span className="text-2xl font-bold tabular-nums">{formatYen(total)}</span>
      </div>

      {/* 支払方法別 */}
      <div className="flex gap-2 flex-wrap">
        {cash > 0 && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-lg">現金 {formatYen(cash)}</span>}
        {credit > 0 && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">カード {formatYen(credit)}</span>}
        {ticket > 0 && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg">回数券 {formatYen(ticket)}</span>}
        {service > 0 && <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-lg">サービス {formatYen(service)}</span>}
      </div>

      {/* カテゴリ比率バー */}
      {revenueTotal > 0 && (
        <div>
          <div className="flex h-2 rounded-full overflow-hidden bg-background">
            {treatmentTotal > 0 && (
              <div className="bg-category-treatment" style={{ width: `${(treatmentTotal / revenueTotal) * 100}%` }} />
            )}
            {purchaseTotal > 0 && (
              <div className="bg-category-product" style={{ width: `${(purchaseTotal / revenueTotal) * 100}%` }} />
            )}
            {ticketPurchaseTotal > 0 && (
              <div className="bg-category-ticket" style={{ width: `${(ticketPurchaseTotal / revenueTotal) * 100}%` }} />
            )}
          </div>
          <div className="flex gap-3 mt-1.5">
            {treatmentTotal > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-text-light">
                <span className="w-2 h-2 rounded-full bg-category-treatment" />施術 {formatYen(treatmentTotal)}
              </span>
            )}
            {purchaseTotal > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-text-light">
                <span className="w-2 h-2 rounded-full bg-category-product" />物販 {formatYen(purchaseTotal)}
              </span>
            )}
            {ticketPurchaseTotal > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-text-light">
                <span className="w-2 h-2 rounded-full bg-category-ticket" />回数券 {formatYen(ticketPurchaseTotal)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
