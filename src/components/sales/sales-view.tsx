"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ManagementTabs } from "@/components/inventory/management-tabs";
import { SalesBarChart } from "@/components/sales/sales-bar-chart";
import { SalesDrilldown } from "@/components/sales/sales-drilldown";
import { SalesMonthlyList } from "@/components/sales/sales-monthly-list";
import { formatYen, getFilteredTotal, CATEGORY_OPTIONS } from "@/components/sales/sales-types";
import type { MonthlySales, DailySales, CategoryFilter } from "@/components/sales/sales-types";

type Props = {
  salonId: string;
  initialData: MonthlySales[];
  initialYear: number;
};

/** 売上レポートのClient Component（初期データはServerから注入） */
export function SalesView({ salonId, initialData, initialYear }: Props) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(initialYear);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [drillMonth, setDrillMonth] = useState<number | null>(null);
  const [drillData, setDrillData] = useState<DailySales[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  // 初期データを使ったかどうか（初回は Server データを使う）
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadSales = useCallback(async (targetYear: number) => {
    setLoading(true);
    const supabase = createClient();
    const { data: salesData } = await supabase.rpc("get_monthly_sales_summary", { p_salon_id: salonId, p_year: targetYear });
    setData((salesData as MonthlySales[]) ?? []);
    setLoading(false);
  }, [salonId]);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    loadSales(year);
    setDrillMonth(null);
  }, [year, loadSales, isInitialLoad]);

  const loadDrillMonth = useCallback(async (month: number) => {
    setDrillLoading(true);
    const supabase = createClient();
    const monthStr = String(month).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

    const [recordsRes, purchasesRes, ticketsRes] = await Promise.all([
      supabase.from("treatment_records").select("treatment_date, treatment_record_menus(price_snapshot, payment_type)").eq("salon_id", salonId).gte("treatment_date", startDate).lte("treatment_date", endDate),
      supabase.from("purchases").select("purchase_date, total_price").eq("salon_id", salonId).gte("purchase_date", startDate).lte("purchase_date", endDate),
      supabase.from("course_tickets").select("purchase_date, price").eq("salon_id", salonId).gte("purchase_date", startDate).lte("purchase_date", endDate),
    ]);

    const dailyMap: Record<number, DailySales> = {};
    for (let d = 1; d <= lastDay; d++) dailyMap[d] = { day: d, treatment: 0, product: 0, ticket: 0 };

    for (const rec of recordsRes.data ?? []) {
      const day = parseInt(rec.treatment_date.split("-")[2], 10);
      const menus = (rec.treatment_record_menus ?? []) as { price_snapshot: number | null; payment_type: string }[];
      const total = menus.filter((m) => m.payment_type === "cash" || m.payment_type === "credit").reduce((s, m) => s + (m.price_snapshot ?? 0), 0);
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

  useEffect(() => { if (drillMonth !== null) loadDrillMonth(drillMonth); }, [drillMonth, loadDrillMonth]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const visibleData = data.filter((m) => !(year === currentYear && m.month - 1 > currentMonth));

  const yearTotal = visibleData.reduce((acc, m) => ({
    treatment: acc.treatment + m.treatment_sales, product: acc.product + m.product_sales, ticket: acc.ticket + m.ticket_sales,
  }), { treatment: 0, product: 0, ticket: 0 });
  const grandTotal = yearTotal.treatment + yearTotal.product + yearTotal.ticket;

  const filteredTotals = visibleData.map((m) => getFilteredTotal(m, categoryFilter));
  const maxMonthly = Math.max(...filteredTotals, 1);

  const handleDrillToggle = (month: number | null) => setDrillMonth(month);

  return (
    <div className="space-y-4">
      <ManagementTabs />
      <h2 className="text-xl font-bold">売上レポート</h2>

      {/* 年ナビゲーション */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
        <button onClick={() => setYear((y) => y - 1)} className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </button>
        <span className="font-bold text-lg">{year}年</span>
        <button onClick={() => setYear((y) => y + 1)} disabled={year >= currentYear} className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5 animate-pulse space-y-3">
            <div className="h-4 bg-border rounded w-20" />
            <div className="h-8 bg-border rounded w-36" />
            <div className="flex gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-3 bg-border rounded w-20" />)}</div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-border rounded w-24 mb-4" />
            <div className="h-40 bg-border rounded" />
          </div>
        </div>
      ) : visibleData.length === 0 || grandTotal === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-light">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-border">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <p className="font-medium">まだ売上データがありません</p>
          <p className="text-xs mt-1">カルテや物販を登録すると集計されます</p>
        </div>
      ) : (
        <>
          {/* 年間サマリー */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-text-light">年間合計</span>
              <span className="text-2xl font-bold">{formatYen(grandTotal)}</span>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-accent" /><span className="text-xs text-text-light">施術</span><span className="text-xs font-medium">{formatYen(yearTotal.treatment)}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400" /><span className="text-xs text-text-light">物販</span><span className="text-xs font-medium">{formatYen(yearTotal.product)}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-amber-400" /><span className="text-xs text-text-light">回数券<span className="text-[9px]">※</span></span><span className="text-xs font-medium">{formatYen(yearTotal.ticket)}</span></div>
            </div>
            {yearTotal.ticket > 0 && <p className="text-[10px] text-text-light">※回数券は販売時の受取額</p>}
          </div>

          {/* 分析ページへのリンク */}
          <Link
            href="/sales/analytics"
            className="block bg-surface border border-border rounded-xl px-4 py-3 hover:border-accent transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">顧客・メニュー分析を見る</span>
              <span className="text-text-light text-sm">→</span>
            </div>
            <p className="text-xs text-text-light mt-0.5">LTV・リピート率・人気メニューなど</p>
          </Link>

          {/* カテゴリフィルタ */}
          <div className="flex gap-1.5">
            {CATEGORY_OPTIONS.map(({ key, label }) => (
              <button key={key} onClick={() => setCategoryFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors min-h-[32px] ${categoryFilter === key ? "bg-accent text-white" : "bg-surface border border-border text-text-light"}`}>
                {label}
              </button>
            ))}
          </div>

          <SalesBarChart visibleData={visibleData} categoryFilter={categoryFilter} maxMonthly={maxMonthly}
            currentMonth={currentMonth} currentYear={currentYear} year={year} drillMonth={drillMonth} onDrillToggle={handleDrillToggle} />

          {drillMonth !== null && (
            <SalesDrilldown drillMonth={drillMonth} data={data} drillData={drillData} drillLoading={drillLoading}
              categoryFilter={categoryFilter} onClose={() => setDrillMonth(null)} />
          )}

          <SalesMonthlyList visibleData={visibleData} categoryFilter={categoryFilter} maxMonthly={maxMonthly}
            currentMonth={currentMonth} currentYear={currentYear} year={year} drillMonth={drillMonth} onDrillToggle={handleDrillToggle} />
        </>
      )}
    </div>
  );
}
