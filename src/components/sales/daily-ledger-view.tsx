"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DateNavigator } from "@/components/ui/date-navigator";
import { EmptyState } from "@/components/ui/empty-state";
import { ManagementTabs } from "@/components/inventory/management-tabs";
import { DailySummaryCard } from "./daily-summary-card";
import { DailyCustomerRow } from "./daily-customer-row";
import { MonthlyForecastView } from "./monthly-forecast-view";
import type { CustomerLedgerEntry, DailyTotals } from "./daily-ledger-types";
import { calcDailyTotals, formatDateLabel } from "./daily-ledger-types";

type Mode = "ledger" | "forecast";
type Props = { salonId: string };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DailyLedgerView({ salonId }: Props) {
  const [mode, setMode] = useState<Mode>("ledger");
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<CustomerLedgerEntry[]>([]);
  const [totals, setTotals] = useState<DailyTotals>({ total: 0, cash: 0, credit: 0, ticket: 0, service: 0, treatmentTotal: 0, purchaseTotal: 0, ticketPurchaseTotal: 0, customerCount: 0 });

  const isToday = date === todayStr();

  const loadLedger = useCallback(async (dateStr: string) => {
    setLoading(true);
    const supabase = createClient();

    const [recordsRes, purchasesRes, ticketsRes] = await Promise.all([
      supabase.from("treatment_records")
        .select("id, customer_id, customers(last_name, first_name), treatment_record_menus(menu_name_snapshot, price_snapshot, payment_type)")
        .eq("salon_id", salonId).eq("treatment_date", dateStr),
      supabase.from("purchases")
        .select("id, customer_id, item_name, total_price, payment_type, customers(last_name, first_name)")
        .eq("salon_id", salonId).eq("purchase_date", dateStr),
      supabase.from("course_tickets")
        .select("id, customer_id, ticket_name, price, payment_type, customers(last_name, first_name)")
        .eq("salon_id", salonId).eq("purchase_date", dateStr),
    ]);

    // customer_id でグループ化
    const map = new Map<string, CustomerLedgerEntry>();
    const custName = (c: { last_name: string; first_name: string } | null) => c ? `${c.last_name} ${c.first_name}` : "不明";
    const ensure = (custId: string, name: string) => {
      if (!map.has(custId)) map.set(custId, { customerId: custId, customerName: name, treatments: [], purchases: [], ticketPurchases: [] });
      return map.get(custId)!;
    };

    for (const rec of recordsRes.data ?? []) {
      const cust = rec.customers as unknown as { last_name: string; first_name: string } | null;
      const entry = ensure(rec.customer_id, custName(cust));
      for (const m of (rec.treatment_record_menus ?? []) as { menu_name_snapshot: string; price_snapshot: number | null; payment_type: string }[]) {
        entry.treatments.push({ menuName: m.menu_name_snapshot, price: m.price_snapshot ?? 0, paymentType: m.payment_type });
      }
    }
    for (const p of purchasesRes.data ?? []) {
      const cust = p.customers as unknown as { last_name: string; first_name: string } | null;
      const entry = ensure(p.customer_id, custName(cust));
      entry.purchases.push({ itemName: p.item_name, totalPrice: p.total_price, paymentType: p.payment_type ?? "cash" });
    }
    for (const t of ticketsRes.data ?? []) {
      const cust = t.customers as unknown as { last_name: string; first_name: string } | null;
      const entry = ensure(t.customer_id, custName(cust));
      entry.ticketPurchases.push({ ticketName: t.ticket_name, price: t.price ?? 0, paymentType: t.payment_type ?? "cash" });
    }

    const grouped = Array.from(map.values());
    setEntries(grouped);
    setTotals(calcDailyTotals(grouped));
    setLoading(false);
  }, [salonId]);

  useEffect(() => { if (mode === "ledger") loadLedger(date); }, [mode, date, loadLedger]);

  return (
    <div className="space-y-3">
      <ManagementTabs />
      {/* モード切替 */}
      <div className="flex gap-1 bg-background rounded-xl p-0.5">
        <button
          onClick={() => setMode("ledger")}
          className={`flex-1 text-sm py-2 rounded-lg transition-colors min-h-[44px] font-medium ${mode === "ledger" ? "bg-accent text-white" : "text-text-light"}`}
        >日計表</button>
        <button
          onClick={() => setMode("forecast")}
          className={`flex-1 text-sm py-2 rounded-lg transition-colors min-h-[44px] font-medium ${mode === "forecast" ? "bg-accent text-white" : "text-text-light"}`}
        >月間見込み</button>
      </div>

      {mode === "ledger" ? (
        <div className="space-y-3">
          {/* 日付ナビ + 今日ボタン */}
          <div className="flex gap-2">
            <div className="flex-1">
              <DateNavigator
                label={formatDateLabel(date)}
                onPrev={() => setDate(shiftDate(date, -1))}
                onNext={() => setDate(shiftDate(date, 1))}
                disableNext={isToday}
              />
            </div>
            {!isToday && (
              <button
                onClick={() => setDate(todayStr())}
                className="bg-accent text-white text-sm font-medium rounded-xl px-4 min-h-[44px] transition-colors hover:bg-accent-light"
              >今日</button>
            )}
          </div>

          {loading ? (
            <div className="text-center text-text-light text-sm py-8">読み込み中...</div>
          ) : entries.length === 0 ? (
            <EmptyState illustration="record" message={`${formatDateLabel(date)}の売上はありません`} />
          ) : (
            <>
              <DailySummaryCard date={date} totals={totals} />
              <div className="space-y-2">
                {entries.map((entry) => (
                  <DailyCustomerRow key={entry.customerId} entry={entry} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <MonthlyForecastView salonId={salonId} />
      )}
    </div>
  );
}
