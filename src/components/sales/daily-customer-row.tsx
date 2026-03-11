"use client";

import { formatYen } from "@/components/sales/sales-types";
import type { CustomerLedgerEntry } from "./daily-ledger-types";
import { PAYMENT_LABELS, getCustomerTotal } from "./daily-ledger-types";

type Props = {
  entry: CustomerLedgerEntry;
};

export function DailyCustomerRow({ entry }: Props) {
  const total = getCustomerTotal(entry);

  return (
    <div className="bg-surface border border-border rounded-xl p-3 space-y-1.5">
      {/* 顧客名 + 合計 */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">{entry.customerName} 様</span>
        <span className="font-bold text-sm tabular-nums">{formatYen(total)}</span>
      </div>

      {/* 施術メニュー */}
      {entry.treatments.map((m, i) => (
        <div key={`t-${i}`} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-category-treatment shrink-0" />
          <span className="flex-1 truncate">{m.menuName}</span>
          <span className="text-text-light shrink-0">{PAYMENT_LABELS[m.paymentType] ?? m.paymentType}</span>
          <span className="tabular-nums shrink-0">{formatYen(m.price)}</span>
        </div>
      ))}

      {/* 物販 */}
      {entry.purchases.map((p, i) => (
        <div key={`p-${i}`} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-category-product shrink-0" />
          <span className="flex-1 truncate">{p.itemName}</span>
          <span className="text-text-light shrink-0">{PAYMENT_LABELS[p.paymentType] ?? p.paymentType}</span>
          <span className="tabular-nums shrink-0">{formatYen(p.totalPrice)}</span>
        </div>
      ))}

      {/* 回数券購入 */}
      {entry.ticketPurchases.map((t, i) => (
        <div key={`k-${i}`} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-category-ticket shrink-0" />
          <span className="flex-1 truncate">{t.ticketName}</span>
          <span className="text-text-light shrink-0">{PAYMENT_LABELS[t.paymentType] ?? t.paymentType}</span>
          <span className="tabular-nums shrink-0">{formatYen(t.price)}</span>
        </div>
      ))}
    </div>
  );
}
