"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatYen } from "@/components/sales/sales-types";
import { DateNavigator } from "@/components/ui/date-navigator";
import { EmptyState } from "@/components/ui/empty-state";
import { ForecastDayGroup } from "./forecast-day-group";
import type { CustomerLedgerEntry, ForecastEntry } from "./daily-ledger-types";

type Props = { salonId: string };

type DayData = {
  date: string;
  actualEntries: CustomerLedgerEntry[];
  forecastEntries: ForecastEntry[];
  dayTotal: number;
  isActual: boolean;
};

export function MonthlyForecastView({ salonId }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DayData[]>([]);
  const [actualTotal, setActualTotal] = useState(0);
  const [forecastTotal, setForecastTotal] = useState(0);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [recordsRes, purchasesRes, ticketsRes, appointmentsRes] = await Promise.all([
      supabase.from("treatment_records")
        .select("id, customer_id, treatment_date, customers(last_name, first_name), treatment_record_menus(menu_name_snapshot, price_snapshot, payment_type)")
        .eq("salon_id", salonId).gte("treatment_date", startDate).lte("treatment_date", endDate),
      supabase.from("purchases")
        .select("id, customer_id, purchase_date, item_name, total_price, payment_type, customers(last_name, first_name)")
        .eq("salon_id", salonId).gte("purchase_date", startDate).lte("purchase_date", endDate),
      supabase.from("course_tickets")
        .select("id, customer_id, purchase_date, ticket_name, price, payment_type, customers(last_name, first_name)")
        .eq("salon_id", salonId).gte("purchase_date", startDate).lte("purchase_date", endDate),
      supabase.from("appointments")
        .select("id, customer_id, appointment_date, start_time, customers(last_name, first_name), appointment_menus(menu_name_snapshot, price_snapshot)")
        .eq("salon_id", salonId).eq("status", "scheduled")
        .gte("appointment_date", startDate).lte("appointment_date", endDate)
        .order("appointment_date").order("start_time"),
    ]);

    // 日別マップ構築
    const dayMap = new Map<string, { actuals: Map<string, CustomerLedgerEntry>; forecasts: ForecastEntry[] }>();
    const ensureDay = (d: string) => { if (!dayMap.has(d)) dayMap.set(d, { actuals: new Map(), forecasts: [] }); return dayMap.get(d)!; };
    const custName = (c: { last_name: string; first_name: string } | null) => c ? `${c.last_name} ${c.first_name}` : "不明";
    const ensureActual = (d: string, custId: string, name: string) => {
      const day = ensureDay(d);
      if (!day.actuals.has(custId)) day.actuals.set(custId, { customerId: custId, customerName: name, treatments: [], purchases: [], ticketPurchases: [] });
      return day.actuals.get(custId)!;
    };

    // 確定分: 施術
    for (const rec of recordsRes.data ?? []) {
      const cust = rec.customers as unknown as { last_name: string; first_name: string } | null;
      const entry = ensureActual(rec.treatment_date, rec.customer_id, custName(cust));
      for (const m of (rec.treatment_record_menus ?? []) as { menu_name_snapshot: string; price_snapshot: number | null; payment_type: string }[]) {
        entry.treatments.push({ menuName: m.menu_name_snapshot, price: m.price_snapshot ?? 0, paymentType: m.payment_type });
      }
    }
    // 確定分: 物販
    for (const p of purchasesRes.data ?? []) {
      const cust = p.customers as unknown as { last_name: string; first_name: string } | null;
      const entry = ensureActual(p.purchase_date, p.customer_id, custName(cust));
      entry.purchases.push({ itemName: p.item_name, totalPrice: p.total_price, paymentType: p.payment_type ?? "cash" });
    }
    // 確定分: 回数券購入
    for (const t of ticketsRes.data ?? []) {
      const cust = t.customers as unknown as { last_name: string; first_name: string } | null;
      const entry = ensureActual(t.purchase_date, t.customer_id, custName(cust));
      entry.ticketPurchases.push({ ticketName: t.ticket_name, price: t.price ?? 0, paymentType: t.payment_type ?? "cash" });
    }
    // 見込分: 予約
    for (const a of appointmentsRes.data ?? []) {
      const cust = a.customers as unknown as { last_name: string; first_name: string } | null;
      const menus = ((a.appointment_menus ?? []) as { menu_name_snapshot: string; price_snapshot: number | null }[])
        .map((m) => ({ menuName: m.menu_name_snapshot, price: m.price_snapshot ?? 0 }));
      const day = ensureDay(a.appointment_date);
      day.forecasts.push({
        customerId: a.customer_id, customerName: custName(cust),
        date: a.appointment_date, startTime: a.start_time ?? "00:00",
        menus, totalAmount: menus.reduce((s, m) => s + m.price, 0),
      });
    }

    // 集計
    let actSum = 0, fcSum = 0;
    const sortedDays: DayData[] = [];
    const allDates = Array.from(dayMap.keys()).sort();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    for (const date of allDates) {
      const d = dayMap.get(date)!;
      const actuals = Array.from(d.actuals.values());
      const actTotal = actuals.reduce((s, e) => s + e.treatments.reduce((a, m) => a + m.price, 0) + e.purchases.reduce((a, p) => a + p.totalPrice, 0) + e.ticketPurchases.reduce((a, t) => a + t.price, 0), 0);
      const fcTotal = d.forecasts.reduce((s, f) => s + f.totalAmount, 0);
      actSum += actTotal;
      fcSum += fcTotal;
      const isActual = date <= todayStr;
      sortedDays.push({ date, actualEntries: actuals, forecastEntries: d.forecasts, dayTotal: actTotal + fcTotal, isActual });
    }
    setDays(sortedDays);
    setActualTotal(actSum);
    setForecastTotal(fcSum);
    setLoading(false);
  }, [salonId, year, month]);

  useEffect(() => { loadData(); }, [loadData]);

  const prevMonth = () => { if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1); };

  return (
    <div className="space-y-3">
      <DateNavigator label={`${year}年${month}月`} onPrev={prevMonth} onNext={nextMonth} disableNext={isCurrentMonth} />

      {/* サマリーカード */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">確定売上</span>
          <span className="text-lg font-bold tabular-nums">{formatYen(actualTotal)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-blue-600">見込み（予約分）</span>
          <span className="text-lg font-bold tabular-nums text-blue-600">{formatYen(forecastTotal)}</span>
        </div>
        <div className="border-t border-border pt-2 flex items-baseline justify-between">
          <span className="text-sm font-bold">今月の見込合計</span>
          <span className="text-2xl font-bold tabular-nums">{formatYen(actualTotal + forecastTotal)}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-text-light text-sm py-8">読み込み中...</div>
      ) : days.length === 0 ? (
        <EmptyState illustration="record" message="この月のデータはまだありません" />
      ) : (
        <div className="space-y-4">
          {days.map((d) => (
            <ForecastDayGroup
              key={d.date}
              date={d.date}
              isActual={d.isActual}
              actualEntries={d.actualEntries}
              forecastEntries={d.forecastEntries}
              dayTotal={d.dayTotal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
