"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";

type TaxReportData = {
  year: number;
  opening_stock_value: number;
  closing_stock_value: number;
  total_purchases: number;
  cost_of_goods_sold: number;
  monthly_purchases: { month: number; amount: number }[];
  closing_stock_details: {
    product_name: string;
    stock: number;
    unit_price: number;
    total_value: number;
  }[];
};

type MonthlySales = {
  month: number;
  treatment_sales: number;
  product_sales: number;
  ticket_sales: number;
  ticket_consumption: number;
  service_amount: number;
};

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

type CsvFormat = "generic" | "freee" | "yayoi";

export default function TaxReportPage() {
  const [report, setReport] = useState<TaxReportData | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadReport = useCallback(async (targetYear: number) => {
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

    // 在庫レポートと売上データを並列取得
    const [taxRes, salesRes] = await Promise.all([
      supabase.rpc("get_tax_report", {
        p_salon_id: salon.id,
        p_year: targetYear,
      }),
      supabase.rpc("get_monthly_sales_summary", {
        p_salon_id: salon.id,
        p_year: targetYear,
      }),
    ]);

    if (taxRes.data) {
      setReport(taxRes.data as unknown as TaxReportData);
    }
    setMonthlySales((salesRes.data as MonthlySales[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReport(year);
  }, [year, loadReport]);

  const currentYear = new Date().getFullYear();

  // 年間売上合計
  const totalTreatmentSales = monthlySales.reduce((s, m) => s + m.treatment_sales, 0);
  const totalProductSales = monthlySales.reduce((s, m) => s + m.product_sales, 0);
  const totalTicketSales = monthlySales.reduce((s, m) => s + m.ticket_sales, 0);
  const totalSales = totalTreatmentSales + totalProductSales + totalTicketSales;

  // CSV生成
  const downloadCsv = (format: CsvFormat) => {
    if (!report) return;

    let csvContent = "";
    const bom = "\uFEFF"; // UTF-8 BOM for Excel

    if (format === "generic") {
      csvContent = generateGenericCsv(report, monthlySales, year);
    } else if (format === "freee") {
      csvContent = generateFreeeCsv(report, monthlySales, year);
    } else if (format === "yayoi") {
      csvContent = generateYayoiCsv(report, monthlySales, year);
    }

    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `確定申告_${year}年_${format}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="確定申告レポート"
        backLabel="在庫管理"
        backHref="/sales/inventory"
        breadcrumbs={[
          { label: "経営", href: "/sales" },
          { label: "在庫管理", href: "/sales/inventory" },
          { label: "確定申告レポート" },
        ]}
      />

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
        <>
          {/* 売上原価計算 */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm">売上原価の計算</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-light">期首棚卸高</span>
                <span className="font-medium tabular-nums">{formatYen(report.opening_stock_value)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-light">＋ 当期仕入高</span>
                <span className="font-medium tabular-nums">{formatYen(report.total_purchases)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-light">− 期末棚卸高</span>
                <span className="font-medium tabular-nums">{formatYen(report.closing_stock_value)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-bold text-sm">＝ 売上原価</span>
                <span className="font-bold text-lg text-accent tabular-nums">
                  {formatYen(report.cost_of_goods_sold)}
                </span>
              </div>
            </div>
          </div>

          {/* 粗利サマリー */}
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 space-y-2">
            <h3 className="font-bold text-sm">粗利サマリー</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-light">年間売上合計</p>
                <p className="text-lg font-bold tabular-nums">{formatYen(totalSales)}</p>
              </div>
              <div>
                <p className="text-xs text-text-light">売上原価</p>
                <p className="text-lg font-bold tabular-nums">{formatYen(report.cost_of_goods_sold)}</p>
              </div>
            </div>
            <div className="border-t border-accent/20 pt-2">
              <p className="text-xs text-text-light">粗利</p>
              <p className="text-xl font-bold text-accent tabular-nums">
                {formatYen(totalSales - report.cost_of_goods_sold)}
              </p>
            </div>
          </div>

          {/* 月別売上 */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm">月別売上</h3>
            {monthlySales.length === 0 ? (
              <p className="text-sm text-text-light text-center py-2">データなし</p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-1 text-[10px] text-text-light font-medium pb-1 border-b border-border">
                  <span></span>
                  <span className="text-right">施術</span>
                  <span className="text-right">物販</span>
                  <span className="text-right">回数券</span>
                  <span className="text-right font-bold">計</span>
                </div>
                {monthlySales.map((m) => {
                  const total = m.treatment_sales + m.product_sales + m.ticket_sales;
                  return (
                    <div key={m.month} className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-1 text-xs tabular-nums py-1">
                      <span className="text-text-light font-medium">{m.month}月</span>
                      <span className="text-right">{m.treatment_sales.toLocaleString()}</span>
                      <span className="text-right">{m.product_sales.toLocaleString()}</span>
                      <span className="text-right">{m.ticket_sales.toLocaleString()}</span>
                      <span className="text-right font-bold">{total.toLocaleString()}</span>
                    </div>
                  );
                })}
                <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] gap-1 text-xs tabular-nums pt-1 border-t border-border font-bold">
                  <span>合計</span>
                  <span className="text-right">{totalTreatmentSales.toLocaleString()}</span>
                  <span className="text-right">{totalProductSales.toLocaleString()}</span>
                  <span className="text-right">{totalTicketSales.toLocaleString()}</span>
                  <span className="text-right text-accent">{totalSales.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* 月別仕入 */}
          {report.monthly_purchases.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-sm">月別仕入金額</h3>
              <div className="space-y-1">
                {report.monthly_purchases.map((mp) => (
                  <div key={mp.month} className="flex justify-between text-sm">
                    <span className="text-text-light">{mp.month}月</span>
                    <span className="font-medium tabular-nums">{formatYen(mp.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm border-t border-border pt-1 font-bold">
                  <span>合計</span>
                  <span className="tabular-nums">{formatYen(report.total_purchases)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 期末棚卸明細 */}
          {report.closing_stock_details.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-sm">期末棚卸明細</h3>
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_50px_70px_80px] gap-1 text-[10px] text-text-light font-medium pb-1 border-b border-border">
                  <span>商品名</span>
                  <span className="text-right">在庫</span>
                  <span className="text-right">単価</span>
                  <span className="text-right">金額</span>
                </div>
                {report.closing_stock_details.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_50px_70px_80px] gap-1 text-xs tabular-nums py-1">
                    <span className="truncate">{item.product_name}</span>
                    <span className="text-right">{item.stock}</span>
                    <span className="text-right">{item.unit_price.toLocaleString()}</span>
                    <span className="text-right font-medium">{item.total_value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm border-t border-border pt-1 font-bold">
                  <span>期末棚卸高 合計</span>
                  <span className="tabular-nums">{formatYen(report.closing_stock_value)}</span>
                </div>
              </div>
            </div>
          )}

          {/* CSV出力 */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm">CSV出力</h3>
            <p className="text-xs text-text-light">
              確定申告用のデータをCSV形式でダウンロードできます
            </p>
            <div className="space-y-2">
              <button
                onClick={() => downloadCsv("generic")}
                className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors min-h-[48px] text-sm"
              >
                汎用CSV ダウンロード
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => downloadCsv("freee")}
                  className="bg-background border border-border text-text font-medium rounded-xl py-2.5 transition-colors min-h-[44px] text-sm hover:bg-border/30"
                >
                  freee形式
                </button>
                <button
                  onClick={() => downloadCsv("yayoi")}
                  className="bg-background border border-border text-text font-medium rounded-xl py-2.5 transition-colors min-h-[44px] text-sm hover:bg-border/30"
                >
                  弥生形式
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- CSV Generator Functions ---

function generateGenericCsv(
  report: TaxReportData,
  monthlySales: MonthlySales[],
  year: number
): string {
  const lines: string[] = [];

  lines.push(`${year}年 確定申告レポート`);
  lines.push("");

  // 売上原価
  lines.push("【売上原価】");
  lines.push("項目,金額");
  lines.push(`期首棚卸高,${report.opening_stock_value}`);
  lines.push(`当期仕入高,${report.total_purchases}`);
  lines.push(`期末棚卸高,${report.closing_stock_value}`);
  lines.push(`売上原価,${report.cost_of_goods_sold}`);
  lines.push("");

  // 月別売上
  lines.push("【月別売上】");
  lines.push("月,施術,物販,回数券,合計");
  for (const m of monthlySales) {
    const total = m.treatment_sales + m.product_sales + m.ticket_sales;
    lines.push(`${m.month},${m.treatment_sales},${m.product_sales},${m.ticket_sales},${total}`);
  }
  lines.push("");

  // 月別仕入
  if (report.monthly_purchases.length > 0) {
    lines.push("【月別仕入】");
    lines.push("月,仕入金額");
    for (const mp of report.monthly_purchases) {
      lines.push(`${mp.month},${mp.amount}`);
    }
    lines.push("");
  }

  // 期末棚卸明細
  if (report.closing_stock_details.length > 0) {
    lines.push("【期末棚卸明細】");
    lines.push("商品名,在庫数,仕入単価,金額");
    for (const item of report.closing_stock_details) {
      lines.push(`"${item.product_name}",${item.stock},${item.unit_price},${item.total_value}`);
    }
  }

  return lines.join("\n");
}

function generateFreeeCsv(
  report: TaxReportData,
  monthlySales: MonthlySales[],
  year: number
): string {
  // freee取り込み形式: 日付, 勘定科目, 金額, 摘要
  const lines: string[] = [];
  lines.push("取引日,勘定科目,税区分,金額,摘要");

  // 月別売上
  for (const m of monthlySales) {
    const date = `${year}/${String(m.month).padStart(2, "0")}/01`;
    if (m.treatment_sales > 0) {
      lines.push(`${date},売上高,課税売上10%,${m.treatment_sales},施術売上 ${m.month}月分`);
    }
    if (m.product_sales > 0) {
      lines.push(`${date},売上高,課税売上10%,${m.product_sales},物販売上 ${m.month}月分`);
    }
    if (m.ticket_sales > 0) {
      lines.push(`${date},売上高,課税売上10%,${m.ticket_sales},回数券売上 ${m.month}月分`);
    }
  }

  // 月別仕入
  for (const mp of report.monthly_purchases) {
    const date = `${year}/${String(mp.month).padStart(2, "0")}/01`;
    lines.push(`${date},仕入高,課対仕入10%,${mp.amount},商品仕入 ${mp.month}月分`);
  }

  return lines.join("\n");
}

function generateYayoiCsv(
  report: TaxReportData,
  monthlySales: MonthlySales[],
  year: number
): string {
  // 弥生形式: 仕訳日付, 借方勘定科目, 借方金額, 貸方勘定科目, 貸方金額, 摘要
  const lines: string[] = [];
  lines.push("仕訳日付,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要");

  // 月別売上
  for (const m of monthlySales) {
    const total = m.treatment_sales + m.product_sales + m.ticket_sales;
    if (total > 0) {
      const date = `${year}/${String(m.month).padStart(2, "0")}/01`;
      lines.push(`${date},売掛金,${total},売上高,${total},${m.month}月 売上合計`);
    }
  }

  // 月別仕入
  for (const mp of report.monthly_purchases) {
    const date = `${year}/${String(mp.month).padStart(2, "0")}/01`;
    lines.push(`${date},仕入高,${mp.amount},買掛金,${mp.amount},${mp.month}月 商品仕入`);
  }

  // 期末棚卸
  if (report.closing_stock_value > 0) {
    lines.push(`${year}/12/31,商品,${report.closing_stock_value},期末商品棚卸高,${report.closing_stock_value},期末棚卸`);
  }

  return lines.join("\n");
}
