"use client";

import Link from "next/link";
import type { CsvTaxReport, CsvMonthlySales } from "@/lib/csv-generators";

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

type Props = {
  report: CsvTaxReport;
  monthlySales: CsvMonthlySales[];
  year: number;
};

/** 売上・仕入レポートの各セクション表示 */
export function TaxReportSections({ report, monthlySales, year }: Props) {
  const totalTreatmentSales = monthlySales.reduce((s, m) => s + m.treatment_sales, 0);
  const totalProductSales = monthlySales.reduce((s, m) => s + m.product_sales, 0);
  const totalTicketSales = monthlySales.reduce((s, m) => s + m.ticket_sales, 0);
  const totalSales = totalTreatmentSales + totalProductSales + totalTicketSales;

  return (
    <>
      {/* 免責注記 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-800 font-medium">このレポートは売上・仕入の参考資料です</p>
        <p className="text-[10px] text-amber-700 mt-0.5">確定申告には税理士や会計ソフトでの確認をお勧めします。金額は本アプリへの入力値に基づくため、実際の入出金とは異なる場合があります。</p>
      </div>

      {/* 年間サマリー */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 space-y-2">
        <h3 className="font-bold text-sm">年間の売上と仕入</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-light">年間売上合計</p>
            <p className="text-lg font-bold tabular-nums">{formatYen(totalSales)}</p>
          </div>
          <div>
            <p className="text-xs text-text-light">年間仕入合計</p>
            <p className="text-lg font-bold tabular-nums">{formatYen(report.total_purchases)}</p>
          </div>
        </div>
        <p className="text-[10px] text-text-light leading-relaxed">
          仕入金額は「仕入入庫」で記録した実際の金額です。粗利や売上原価の計算は会計ソフトで行ってください。
        </p>
      </div>

      {/* 月別売上 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div>
          <h3 className="font-bold text-sm">月別売上</h3>
          <p className="text-[10px] text-text-light mt-0.5">施術・物販・回数券の月ごとの売上金額です。</p>
        </div>
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

      {/* 期末在庫明細 */}
      {report.closing_stock_details.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
          <div>
            <h3 className="font-bold text-sm">年末在庫の明細</h3>
            <p className="text-[10px] text-text-light mt-0.5">
              {year}年末時点で残っている商品の一覧です。参考単価は商品マスタの仕入単価で算出した概算です。
            </p>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_50px_70px_80px] gap-1 text-[10px] text-text-light font-medium pb-1 border-b border-border">
              <span>商品名</span><span className="text-right">在庫</span><span className="text-right">参考単価</span><span className="text-right">参考金額</span>
            </div>
            {report.closing_stock_details.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_50px_70px_80px] gap-1 text-xs tabular-nums py-1">
                <span className="truncate">{item.product_name}</span>
                <span className="text-right font-medium">{item.stock}</span>
                <span className="text-right">{item.unit_price.toLocaleString()}</span>
                <span className="text-right">{item.total_value.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm border-t border-border pt-1 font-bold">
              <span>年末在庫 合計（参考）</span><span className="tabular-nums">{formatYen(report.closing_stock_value)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 会計ソフト連携への誘導 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm">会計ソフトに取り込むには</h3>
        <p className="text-xs text-text-light leading-relaxed">
          freee・マネーフォワード・弥生会計に取り込める仕訳CSVは、設定画面のデータエクスポートからダウンロードできます。
        </p>
        <Link
          href="/settings/export"
          className="block w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors min-h-[48px] text-sm text-center"
        >
          データエクスポートへ →
        </Link>
      </div>
    </>
  );
}
