"use client";

import { formatYen } from "@/components/sales/sales-types";
import type { CustomerLedgerEntry, ForecastEntry } from "./daily-ledger-types";
import { formatDateLabel, getCustomerTotal, PAYMENT_LABELS } from "./daily-ledger-types";

type Props = {
  date: string;
  isActual: boolean;
  actualEntries?: CustomerLedgerEntry[];
  forecastEntries?: ForecastEntry[];
  dayTotal: number;
};

export function ForecastDayGroup({ date, isActual, actualEntries = [], forecastEntries = [], dayTotal }: Props) {
  const borderClass = isActual
    ? "border-l-4 border-l-accent border border-border"
    : "border-l-4 border-l-blue-400 border border-blue-200";

  return (
    <div className="space-y-1.5">
      {/* 日付ヘッダー */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-text-light">{formatDateLabel(date)}</span>
        <span className="text-xs font-medium tabular-nums">{formatYen(dayTotal)}</span>
      </div>

      {/* 確定分 */}
      {actualEntries.map((entry) => (
        <div key={entry.customerId} className={`bg-surface ${borderClass} rounded-xl p-2.5`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{entry.customerName} 様</span>
            <span className="text-sm tabular-nums">{formatYen(getCustomerTotal(entry))}</span>
          </div>
          <div className="text-xs text-text-light mt-0.5 truncate">
            {[
              ...entry.treatments.map((m) => m.menuName),
              ...entry.purchases.map((p) => p.itemName),
              ...entry.ticketPurchases.map((t) => t.ticketName),
            ].join("・")}
          </div>
          {entry.treatments.length > 0 && (
            <div className="text-[10px] text-text-light mt-0.5">
              {entry.treatments.map((m) => PAYMENT_LABELS[m.paymentType] ?? m.paymentType).filter((v, i, a) => a.indexOf(v) === i).join("・")}
            </div>
          )}
        </div>
      ))}

      {/* 見込分 */}
      {forecastEntries.map((entry) => (
        <div key={entry.customerId + entry.date} className="bg-blue-50/50 border-l-4 border-l-blue-400 border border-blue-200 rounded-xl p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">{entry.customerName} 様</span>
              <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">予約</span>
            </div>
            <span className="text-sm tabular-nums text-blue-700">{formatYen(entry.totalAmount)}</span>
          </div>
          <div className="text-xs text-text-light mt-0.5 truncate">
            {entry.startTime.slice(0, 5)}〜 {entry.menus.map((m) => m.menuName).join("・")}
          </div>
        </div>
      ))}
    </div>
  );
}
