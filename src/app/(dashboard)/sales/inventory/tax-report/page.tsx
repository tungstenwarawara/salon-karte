"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import type { CsvTaxReport, CsvMonthlySales } from "@/lib/csv-generators";
import { TaxReportSections } from "@/components/inventory/tax-report-sections";

export default function TaxReportPage() {
  // オーナーのみアクセス可（sales/layout.tsx で制御）
  const [report, setReport] = useState<CsvTaxReport | null>(null);
  const [monthlySales, setMonthlySales] = useState<CsvMonthlySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadReport = useCallback(async (targetYear: number) => {
    setLoading(true);
    const { user, salonId } = await getClientAuth();
    if (!user || !salonId) return;

    const supabase = createClient();
    const [taxRes, salesRes] = await Promise.all([
      supabase.rpc("get_tax_report", { p_salon_id: salonId, p_year: targetYear }),
      supabase.rpc("get_monthly_sales_summary", { p_salon_id: salonId, p_year: targetYear }),
    ]);

    if (taxRes.data) setReport(taxRes.data as unknown as CsvTaxReport);
    setMonthlySales((salesRes.data as CsvMonthlySales[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReport(year);
  }, [year, loadReport]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <PageHeader
        title="年間収支サマリー"
        breadcrumbs={[
          { label: "経営", href: "/sales" },
          { label: "在庫管理", href: "/sales/inventory" },
          { label: "年間収支サマリー" },
        ]}
      />

      {/* 年ナビゲーション */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
        <button onClick={() => setYear((y) => y - 1)}
          className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="font-bold text-lg">{year}年</span>
        <button onClick={() => setYear((y) => y + 1)} disabled={year >= currentYear}
          className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* ページ説明 */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
        <p className="text-sm text-text font-medium">1年間の売上と仕入を一覧で確認できます</p>
        <p className="text-xs text-text-light mt-1 leading-relaxed">
          会計ソフトへの入力や、確定申告の準備にお役立てください。
          仕訳データのCSVダウンロードは「設定 → データエクスポート」から行えます。
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-border rounded w-32 mb-3" />
              <div className="h-8 bg-border rounded w-48" />
            </div>
          ))}
        </div>
      ) : !report ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
          データがありません
        </div>
      ) : (
        <TaxReportSections report={report} monthlySales={monthlySales} year={year} />
      )}
    </div>
  );
}
