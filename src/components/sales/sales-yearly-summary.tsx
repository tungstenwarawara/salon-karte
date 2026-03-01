import { formatYen, categoryDotColor } from "@/components/sales/sales-types";

type YearTotal = {
  treatment: number;
  product: number;
  ticket: number;
  ticketConsumption: number;
  service: number;
};

type Props = {
  yearTotal: YearTotal;
  grandTotal: number;
  deferredRevenue: number;
};

/** 年間サマリーカード */
export function SalesYearlySummary({ yearTotal, grandTotal, deferredRevenue }: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-text-light">年間合計</span>
        <span className="text-2xl font-bold">{formatYen(grandTotal)}</span>
      </div>
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded-sm ${categoryDotColor("treatment")}`} /><span className="text-xs text-text-light">施術</span><span className="text-xs font-medium">{formatYen(yearTotal.treatment)}</span></div>
        <div className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded-sm ${categoryDotColor("product")}`} /><span className="text-xs text-text-light">物販</span><span className="text-xs font-medium">{formatYen(yearTotal.product)}</span></div>
        <div className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded-sm ${categoryDotColor("ticket")}`} /><span className="text-xs text-text-light">回数券<span className="text-[9px]">※</span></span><span className="text-xs font-medium">{formatYen(yearTotal.ticket)}</span></div>
      </div>

      {/* 構成比バー */}
      {grandTotal > 0 && (
        <div className="flex h-2.5 rounded-full overflow-hidden bg-background">
          {yearTotal.treatment > 0 && (
            <div className="bg-category-treatment h-full transition-all duration-500"
              style={{ width: `${(yearTotal.treatment / grandTotal) * 100}%` }} />
          )}
          {yearTotal.product > 0 && (
            <div className="bg-category-product h-full transition-all duration-500"
              style={{ width: `${(yearTotal.product / grandTotal) * 100}%` }} />
          )}
          {yearTotal.ticket > 0 && (
            <div className="bg-category-ticket h-full transition-all duration-500"
              style={{ width: `${(yearTotal.ticket / grandTotal) * 100}%` }} />
          )}
        </div>
      )}

      {yearTotal.ticket > 0 && <p className="text-[10px] text-text-light">※回数券は販売時の受取額</p>}
      {(yearTotal.ticketConsumption > 0 || yearTotal.service > 0 || deferredRevenue > 0) && (
        <div className="text-[10px] text-text-light space-y-0.5">
          {(yearTotal.ticketConsumption > 0 || yearTotal.service > 0) && (
            <p>
              参考：
              {yearTotal.ticketConsumption > 0 && `回数券消化 ${formatYen(yearTotal.ticketConsumption)}`}
              {yearTotal.ticketConsumption > 0 && yearTotal.service > 0 && " / "}
              {yearTotal.service > 0 && `サービス ${formatYen(yearTotal.service)}`}
            </p>
          )}
          {deferredRevenue > 0 && <p>回数券 未使用分：{formatYen(deferredRevenue)}</p>}
        </div>
      )}
    </div>
  );
}
