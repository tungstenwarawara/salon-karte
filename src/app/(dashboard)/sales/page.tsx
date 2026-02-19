"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";

type MonthlySales = {
  month: number;
  treatment_sales: number;
  product_sales: number;
  ticket_sales: number;
};

const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

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

export default function SalesPage() {
  const [data, setData] = useState<MonthlySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

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

    const { data: salesData } = await supabase.rpc("get_monthly_sales_summary", {
      p_salon_id: salon.id,
      p_year: targetYear,
    });

    setData((salesData as MonthlySales[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSales(year);
  }, [year, loadSales]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  // Calculate totals
  const yearTotal = data.reduce(
    (acc, m) => ({
      treatment: acc.treatment + m.treatment_sales,
      product: acc.product + m.product_sales,
      ticket: acc.ticket + m.ticket_sales,
    }),
    { treatment: 0, product: 0, ticket: 0 }
  );
  const grandTotal = yearTotal.treatment + yearTotal.product + yearTotal.ticket;

  // Find max monthly total for bar scaling
  const monthlyTotals = data.map(
    (m) => m.treatment_sales + m.product_sales + m.ticket_sales
  );
  const maxMonthly = Math.max(...monthlyTotals, 1);

  return (
    <div className="space-y-4">
      <PageHeader title="売上レポート" backLabel="戻る" />

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
        <div className="text-center text-text-light py-8">読み込み中...</div>
      ) : (
        <>
          {/* Annual summary card */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-text-light">年間合計</span>
              <span className="text-2xl font-bold">{formatYen(grandTotal)}</span>
            </div>
            <div className="flex gap-4">
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

          {/* Monthly breakdown */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm">月別推移</h3>
            <div className="space-y-2">
              {data.map((m, idx) => {
                const total = m.treatment_sales + m.product_sales + m.ticket_sales;
                const prevTotal = idx > 0
                  ? data[idx - 1].treatment_sales + data[idx - 1].product_sales + data[idx - 1].ticket_sales
                  : 0;
                const change = idx > 0 ? getChangePercent(total, prevTotal) : null;

                // Skip future months in current year
                if (year === currentYear && m.month - 1 > currentMonth) return null;

                const treatmentPct = maxMonthly > 0 ? (m.treatment_sales / maxMonthly) * 100 : 0;
                const productPct = maxMonthly > 0 ? (m.product_sales / maxMonthly) * 100 : 0;
                const ticketPct = maxMonthly > 0 ? (m.ticket_sales / maxMonthly) * 100 : 0;

                return (
                  <div key={m.month} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium w-8 shrink-0">{MONTH_NAMES[m.month - 1]}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{formatYen(total)}</span>
                        {change && (
                          <span className={`text-[10px] font-medium ${change.color}`}>
                            {change.text}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Stacked bar */}
                    <div className="h-4 bg-background rounded-full overflow-hidden flex">
                      {treatmentPct > 0 && (
                        <div
                          className="bg-accent h-full transition-all duration-500"
                          style={{ width: `${treatmentPct}%` }}
                        />
                      )}
                      {productPct > 0 && (
                        <div
                          className="bg-blue-400 h-full transition-all duration-500"
                          style={{ width: `${productPct}%` }}
                        />
                      )}
                      {ticketPct > 0 && (
                        <div
                          className="bg-amber-400 h-full transition-all duration-500"
                          style={{ width: `${ticketPct}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
