"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ManagementTabs } from "@/components/inventory/management-tabs";

type MonthlySales = {
  month: number;
  treatment_sales: number;
  product_sales: number;
  ticket_sales: number;
};

type DailySales = {
  day: number;
  treatment: number;
  product: number;
  ticket: number;
};

type CategoryFilter = "all" | "treatment" | "product" | "ticket";

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

function getChangePercent(current: number, previous: number): { text: string; color: string } | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { text: "New", color: "text-green-600" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { text: `+${pct}%`, color: "text-green-600" };
  if (pct < 0) return { text: `${pct}%`, color: "text-red-500" };
  return { text: "±0%", color: "text-text-light" };
}

function getFilteredTotal(m: MonthlySales, filter: CategoryFilter): number {
  if (filter === "treatment") return m.treatment_sales;
  if (filter === "product") return m.product_sales;
  if (filter === "ticket") return m.ticket_sales;
  return m.treatment_sales + m.product_sales + m.ticket_sales;
}

export default function SalesPage() {
  const [data, setData] = useState<MonthlySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [drillMonth, setDrillMonth] = useState<number | null>(null);
  const [drillData, setDrillData] = useState<DailySales[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);

  const loadSales = useCallback(async (targetYear: number) => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single<{ id: string }>();
    if (!salon) return;
    setSalonId(salon.id);

    const { data: salesData } = await supabase.rpc("get_monthly_sales_summary", {
      p_salon_id: salon.id,
      p_year: targetYear,
    });

    setData((salesData as MonthlySales[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSales(year);
    setDrillMonth(null);
  }, [year, loadSales]);

  // Load drill-down data when a month is selected
  const loadDrillMonth = useCallback(async (month: number) => {
    if (!salonId) return;
    setDrillLoading(true);
    const supabase = createClient();

    const monthStr = String(month).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

    const [aptsRes, purchasesRes, ticketsRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("appointment_date, appointment_menus(price_snapshot)")
        .eq("salon_id", salonId)
        .gte("appointment_date", startDate)
        .lte("appointment_date", endDate)
        .eq("status", "completed"),
      supabase
        .from("purchases")
        .select("purchase_date, total_price")
        .eq("salon_id", salonId)
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate),
      supabase
        .from("course_tickets")
        .select("purchase_date, price")
        .eq("salon_id", salonId)
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate),
    ]);

    // Group by day
    const dailyMap: Record<number, DailySales> = {};
    for (let d = 1; d <= lastDay; d++) {
      dailyMap[d] = { day: d, treatment: 0, product: 0, ticket: 0 };
    }

    for (const apt of aptsRes.data ?? []) {
      const day = parseInt(apt.appointment_date.split("-")[2], 10);
      const menus = (apt.appointment_menus ?? []) as { price_snapshot: number | null }[];
      const total = menus.reduce((s, m) => s + (m.price_snapshot ?? 0), 0);
      if (dailyMap[day]) dailyMap[day].treatment += total;
    }

    for (const p of purchasesRes.data ?? []) {
      const day = parseInt((p.purchase_date as string).split("-")[2], 10);
      if (dailyMap[day]) dailyMap[day].product += (p.total_price as number) ?? 0;
    }

    for (const t of ticketsRes.data ?? []) {
      const day = parseInt((t.purchase_date as string).split("-")[2], 10);
      if (dailyMap[day]) dailyMap[day].ticket += ((t.price as number | null) ?? 0);
    }

    setDrillData(Object.values(dailyMap));
    setDrillLoading(false);
  }, [salonId, year]);

  useEffect(() => {
    if (drillMonth !== null) loadDrillMonth(drillMonth);
  }, [drillMonth, loadDrillMonth]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  // Filter data to visible months
  const visibleData = data.filter(
    (m) => !(year === currentYear && m.month - 1 > currentMonth)
  );

  // Calculate totals with filter
  const yearTotal = visibleData.reduce(
    (acc, m) => ({
      treatment: acc.treatment + m.treatment_sales,
      product: acc.product + m.product_sales,
      ticket: acc.ticket + m.ticket_sales,
    }),
    { treatment: 0, product: 0, ticket: 0 }
  );
  const grandTotal = yearTotal.treatment + yearTotal.product + yearTotal.ticket;

  // Max for bar scaling (filtered)
  const filteredTotals = visibleData.map((m) => getFilteredTotal(m, categoryFilter));
  const maxMonthly = Math.max(...filteredTotals, 1);

  // Drill-down max
  const drillFilteredTotals = drillData.map((d) => {
    if (categoryFilter === "treatment") return d.treatment;
    if (categoryFilter === "product") return d.product;
    if (categoryFilter === "ticket") return d.ticket;
    return d.treatment + d.product + d.ticket;
  });
  const drillMax = Math.max(...drillFilteredTotals, 1);

  const categoryOptions: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: "全体" },
    { key: "treatment", label: "施術" },
    { key: "product", label: "物販" },
    { key: "ticket", label: "回数券" },
  ];

  const filterColor = (filter: CategoryFilter) => {
    if (filter === "treatment") return "bg-accent";
    if (filter === "product") return "bg-blue-400";
    if (filter === "ticket") return "bg-amber-400";
    return "bg-accent";
  };

  return (
    <div className="space-y-4">
      <ManagementTabs />
      <h2 className="text-xl font-bold">売上レポート</h2>

      {/* Year navigation */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="font-bold text-lg">{year}年</span>
        <button
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= currentYear}
          className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {loading ? (
        /* Loading skeleton */
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5 animate-pulse space-y-3">
            <div className="h-4 bg-border rounded w-20" />
            <div className="h-8 bg-border rounded w-36" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-3 bg-border rounded w-20" />)}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-border rounded w-24 mb-4" />
            <div className="h-40 bg-border rounded" />
          </div>
        </div>
      ) : visibleData.length === 0 || grandTotal === 0 ? (
        /* Empty state */
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-light">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-border">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <p className="font-medium">まだ売上データがありません</p>
          <p className="text-xs mt-1">予約が完了すると集計されます</p>
        </div>
      ) : (
        <>
          {/* Annual summary card */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-text-light">年間合計</span>
              <span className="text-2xl font-bold">{formatYen(grandTotal)}</span>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
                <span className="text-xs text-text-light">施術</span>
                <span className="text-xs font-medium">{formatYen(yearTotal.treatment)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
                <span className="text-xs text-text-light">物販</span>
                <span className="text-xs font-medium">{formatYen(yearTotal.product)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span className="text-xs text-text-light">回数券</span>
                <span className="text-xs font-medium">{formatYen(yearTotal.ticket)}</span>
              </div>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5">
            {categoryOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors min-h-[32px] ${
                  categoryFilter === key
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-text-light"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Vertical bar chart */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">月別推移</h3>
              {/* Y-axis max label */}
              <span className="text-[10px] text-text-light">{formatYen(maxMonthly)}</span>
            </div>

            {/* Chart area: fixed pixel height for reliable bar rendering */}
            <div className="relative" style={{ height: "160px" }}>
              {/* Y-axis reference lines with labels */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[1, 0.5, 0].map((ratio) => (
                  <div key={ratio} className="flex items-center gap-1">
                    <div className="flex-1 border-t border-dashed border-border/30" />
                  </div>
                ))}
              </div>

              {/* Bars container — uses absolute positioning for precise height */}
              <div className="relative h-full flex items-end gap-1">
                {visibleData.map((m) => {
                  const total = getFilteredTotal(m, categoryFilter);
                  const barHeight = maxMonthly > 0 ? Math.round((total / maxMonthly) * 148) : 0;
                  const isCurrentMonth = m.month - 1 === currentMonth && year === currentYear;
                  const isDrilling = drillMonth === m.month;

                  return (
                    <button
                      key={m.month}
                      onClick={() => setDrillMonth(drillMonth === m.month ? null : m.month)}
                      className="flex-1 relative group"
                      style={{ height: "100%" }}
                    >
                      {/* Bar — absolute bottom, pixel height */}
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500 ${
                          isDrilling
                            ? filterColor(categoryFilter)
                            : isCurrentMonth
                              ? `${filterColor(categoryFilter)} opacity-90`
                              : `${filterColor(categoryFilter)} opacity-30 group-hover:opacity-60`
                        }`}
                        style={{ height: `${barHeight}px`, minHeight: total > 0 ? "4px" : "0" }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Month labels — separate row below chart */}
            <div className="flex gap-1">
              {visibleData.map((m) => {
                const isDrilling = drillMonth === m.month;
                const isCurrentMonth = m.month - 1 === currentMonth && year === currentYear;
                const total = getFilteredTotal(m, categoryFilter);
                return (
                  <div key={m.month} className="flex-1 text-center">
                    {isDrilling && (
                      <div className="text-[9px] font-bold text-accent truncate">
                        {formatYen(total)}
                      </div>
                    )}
                    <span className={`text-[10px] ${
                      isDrilling ? "text-accent font-bold" : isCurrentMonth ? "font-bold text-text" : "text-text-light"
                    }`}>
                      {m.month}月
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Month drill-down */}
          {drillMonth !== null && (
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">{drillMonth}月 日別内訳</h3>
                  {(() => {
                    const m = data.find((d) => d.month === drillMonth);
                    const total = m ? getFilteredTotal(m, categoryFilter) : 0;
                    return <span className="text-xs text-text-light">{formatYen(total)}</span>;
                  })()}
                </div>
                <button
                  onClick={() => setDrillMonth(null)}
                  className="text-xs text-text-light hover:text-text"
                >
                  閉じる
                </button>
              </div>

              {drillLoading ? (
                <div className="text-center text-text-light text-sm py-4">読み込み中...</div>
              ) : (
                <div className="space-y-1">
                  {drillData
                    .filter((d) => {
                      const total = categoryFilter === "treatment" ? d.treatment
                        : categoryFilter === "product" ? d.product
                        : categoryFilter === "ticket" ? d.ticket
                        : d.treatment + d.product + d.ticket;
                      return total > 0;
                    })
                    .map((d) => {
                      const total = categoryFilter === "treatment" ? d.treatment
                        : categoryFilter === "product" ? d.product
                        : categoryFilter === "ticket" ? d.ticket
                        : d.treatment + d.product + d.ticket;
                      const barWidth = drillMax > 0 ? (total / drillMax) * 100 : 0;

                      return (
                        <div key={d.day} className="flex items-center gap-2">
                          <span className="text-xs text-text-light tabular-nums w-7 shrink-0 text-right">{d.day}日</span>
                          <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${filterColor(categoryFilter)} opacity-60`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium tabular-nums shrink-0 w-20 text-right">{formatYen(total)}</span>
                        </div>
                      );
                    })}
                  {drillData.every((d) => {
                    const t = categoryFilter === "treatment" ? d.treatment
                      : categoryFilter === "product" ? d.product
                      : categoryFilter === "ticket" ? d.ticket
                      : d.treatment + d.product + d.ticket;
                    return t === 0;
                  }) && (
                    <p className="text-sm text-text-light text-center py-2">この月のデータはありません</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Monthly summary list */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm">月別サマリー</h3>
            {visibleData.map((m, idx) => {
              const total = getFilteredTotal(m, categoryFilter);
              const prevTotal = idx > 0 ? getFilteredTotal(visibleData[idx - 1], categoryFilter) : 0;
              const change = idx > 0 ? getChangePercent(total, prevTotal) : null;
              const isCurrentMonth = m.month - 1 === currentMonth && year === currentYear;

              return (
                <button
                  key={m.month}
                  onClick={() => setDrillMonth(drillMonth === m.month ? null : m.month)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    drillMonth === m.month ? "bg-accent/5 border border-accent/20" : "hover:bg-background"
                  }`}
                >
                  <span className={`text-xs font-medium w-8 shrink-0 ${isCurrentMonth ? "text-accent font-bold" : ""}`}>
                    {m.month}月
                  </span>
                  {/* Mini stacked bar */}
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden flex">
                    {categoryFilter === "all" ? (
                      <>
                        {m.treatment_sales > 0 && (
                          <div className="bg-accent h-full" style={{ width: `${maxMonthly > 0 ? (m.treatment_sales / maxMonthly) * 100 : 0}%` }} />
                        )}
                        {m.product_sales > 0 && (
                          <div className="bg-blue-400 h-full" style={{ width: `${maxMonthly > 0 ? (m.product_sales / maxMonthly) * 100 : 0}%` }} />
                        )}
                        {m.ticket_sales > 0 && (
                          <div className="bg-amber-400 h-full" style={{ width: `${maxMonthly > 0 ? (m.ticket_sales / maxMonthly) * 100 : 0}%` }} />
                        )}
                      </>
                    ) : (
                      <div
                        className={`h-full ${filterColor(categoryFilter)} opacity-60`}
                        style={{ width: `${maxMonthly > 0 ? (total / maxMonthly) * 100 : 0}%` }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-bold tabular-nums shrink-0 w-20 text-right">{formatYen(total)}</span>
                  {change && (
                    <span className={`text-[10px] font-medium shrink-0 w-10 text-right ${change.color}`}>
                      {change.text}
                    </span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-text-light shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
