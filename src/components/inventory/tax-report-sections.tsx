"use client";

import type { CsvTaxReport, CsvMonthlySales } from "@/lib/csv-generators";
import { downloadCsv } from "@/lib/csv-generators";

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

type Props = {
  report: CsvTaxReport;
  monthlySales: CsvMonthlySales[];
  year: number;
};

/** 確定申告レポートの各セクション表示 */
export function TaxReportSections({ report, monthlySales, year }: Props) {
  const totalTreatmentSales = monthlySales.reduce((s, m) => s + m.treatment_sales, 0);
  const totalProductSales = monthlySales.reduce((s, m) => s + m.product_sales, 0);
  const totalTicketSales = monthlySales.reduce((s, m) => s + m.ticket_sales, 0);
  const totalSales = totalTreatmentSales + totalProductSales + totalTicketSales;

  return (
    <>
      {/* 注意書き */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-800 font-medium">このレポートは売上・仕入の参考資料です</p>
        <p className="text-[10px] text-amber-700 mt-0.5">確定申告には税理士や会計ソフトでの確認をお勧めします。金額は本アプリへの入力値に基づくため、実際の入出金とは異なる場合があります。</p>
      </div>

      {/* 売上原価計算 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm">売上原価の計算</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-text-light">期首棚卸高</span><span className="font-medium tabular-nums">{formatYen(report.opening_stock_value)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-text-light">＋ 当期仕入高</span><span className="font-medium tabular-nums">{formatYen(report.total_purchases)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-text-light">− 期末棚卸高</span><span className="font-medium tabular-nums">{formatYen(report.closing_stock_value)}</span></div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-bold text-sm">＝ 売上原価</span>
            <span className="font-bold text-lg text-accent tabular-nums">{formatYen(report.cost_of_goods_sold)}</span>
          </div>
        </div>
      </div>

      {/* 粗利サマリー */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 space-y-2">
        <h3 className="font-bold text-sm">粗利サマリー</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-text-light">年間売上合計</p><p className="text-lg font-bold tabular-nums">{formatYen(totalSales)}</p></div>
          <div><p className="text-xs text-text-light">売上原価</p><p className="text-lg font-bold tabular-nums">{formatYen(report.cost_of_goods_sold)}</p></div>
        </div>
        <div className="border-t border-accent/20 pt-2">
          <p className="text-xs text-text-light">粗利</p>
          <p className="text-xl font-bold text-accent tabular-nums">{formatYen(totalSales - report.cost_of_goods_sold)}</p>
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
              <span></span><span className="text-right">施術</span><span className="text-right">物販</span><span className="text-right">回数券</span><span className="text-right font-bold">計</span>
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
              <span>合計</span><span className="tabular-nums">{formatYen(report.total_purchases)}</span>
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
              <span>商品名</span><span className="text-right">在庫</span><span className="text-right">単価</span><span className="text-right">金額</span>
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
              <span>期末棚卸高 合計</span><span className="tabular-nums">{formatYen(report.closing_stock_value)}</span>
            </div>
          </div>
        </div>
      )}

      {/* CSV出力 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm">CSV出力</h3>
        <p className="text-xs text-text-light">売上・仕入の内訳データをCSV形式でダウンロードできます。税理士への共有や会計ソフトへの取り込みにご活用ください。</p>
        <div className="space-y-2">
          <button onClick={() => downloadCsv("generic", report, monthlySales, year)}
            className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors min-h-[48px] text-sm">
            汎用CSV ダウンロード
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => downloadCsv("freee", report, monthlySales, year)}
              className="bg-background border border-border text-text font-medium rounded-xl py-2.5 transition-colors min-h-[44px] text-sm hover:bg-border/30">
              freee形式
            </button>
            <button onClick={() => downloadCsv("yayoi", report, monthlySales, year)}
              className="bg-background border border-border text-text font-medium rounded-xl py-2.5 transition-colors min-h-[44px] text-sm hover:bg-border/30">
              弥生形式
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
