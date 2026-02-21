"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsCards } from "@/components/sales/analytics-cards";
import { TopCustomersList } from "@/components/sales/top-customers-list";
import type { CustomerLtv } from "@/components/sales/top-customers-list";
import { TreatmentRanking } from "@/components/sales/treatment-ranking";
import type { MenuRanking } from "@/components/sales/treatment-ranking";
import { RepeatChart } from "@/components/sales/repeat-chart";

type LtvRow = {
  customer_id: string;
  last_name: string;
  first_name: string;
  visit_count: number;
  treatment_revenue: number;
  purchase_revenue: number;
  ticket_revenue: number;
  first_visit_date: string | null;
  last_visit_date: string | null;
};

type RepeatRow = {
  month: number;
  new_customers: number;
  returning_customers: number;
};

type Props = {
  salonId: string;
  initialLtv: LtvRow[];
  initialRepeat: RepeatRow[];
  initialYear: number;
  menus: MenuRanking[];
};

export function AnalyticsView({ salonId, initialLtv, initialRepeat, initialYear, menus }: Props) {
  const [repeatData, setRepeatData] = useState(initialRepeat);
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // LTVからサマリー指標を算出
  const customersWithVisits = initialLtv.filter((c) => c.visit_count > 0);
  const totalCustomers = initialLtv.length;
  const totalVisits = customersWithVisits.reduce((s, c) => s + c.visit_count, 0);
  const totalRevenue = customersWithVisits.reduce(
    (s, c) => s + c.treatment_revenue + c.purchase_revenue + c.ticket_revenue, 0
  );
  const repeatCustomers = customersWithVisits.filter((c) => c.visit_count >= 2).length;

  const avgRevenuePerVisit = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
  const avgVisits = totalCustomers > 0 ? Math.round((totalVisits / totalCustomers) * 10) / 10 : 0;
  const avgLtv = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

  // トップ顧客
  const topCustomers: CustomerLtv[] = customersWithVisits
    .map((c) => ({
      customer_id: c.customer_id,
      last_name: c.last_name,
      first_name: c.first_name,
      visit_count: c.visit_count,
      total_revenue: c.treatment_revenue + c.purchase_revenue + c.ticket_revenue,
    }))
    .slice(0, 10);

  // 年変更時にリピーターデータを再取得
  const loadRepeat = useCallback(async (targetYear: number) => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("get_monthly_new_vs_returning", {
      p_salon_id: salonId,
      p_year: targetYear,
    });
    setRepeatData((data as RepeatRow[]) ?? []);
    setLoading(false);
  }, [salonId]);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    loadRepeat(year);
  }, [year, loadRepeat, isInitialLoad]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">顧客・メニュー分析</h2>

      <AnalyticsCards
        avgRevenuePerVisit={avgRevenuePerVisit}
        repeatRate={repeatRate}
        avgVisits={avgVisits}
        avgLtv={avgLtv}
      />

      <TopCustomersList customers={topCustomers} />

      <TreatmentRanking menus={menus} />

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
        <div className="bg-surface border border-border rounded-2xl p-5 animate-pulse">
          <div className="h-4 bg-border rounded w-32 mb-4" />
          <div className="h-40 bg-border rounded" />
        </div>
      ) : (
        <RepeatChart data={repeatData} year={year} currentYear={currentYear} currentMonth={currentMonth} />
      )}
    </div>
  );
}
