import Link from "next/link";

export function MonthlySales({
  treatmentSales,
  productSales,
  ticketSales,
  year,
  month,
}: {
  treatmentSales: number;
  productSales: number;
  ticketSales: number;
  year: number;
  month: number;
}) {
  const total = treatmentSales + productSales + ticketSales;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">今月の売上</h3>
        <Link href="/sales" className="text-xs text-accent hover:underline">
          詳しく見る →
        </Link>
      </div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-light">
          {year}年{month}月
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-base font-bold">{treatmentSales.toLocaleString()}<span className="text-xs font-normal text-text-light">円</span></p>
          <p className="text-[10px] text-text-light">施術</p>
        </div>
        <div>
          <p className="text-base font-bold">{productSales.toLocaleString()}<span className="text-xs font-normal text-text-light">円</span></p>
          <p className="text-[10px] text-text-light">物販</p>
        </div>
        <div>
          <p className="text-base font-bold">{ticketSales.toLocaleString()}<span className="text-xs font-normal text-text-light">円</span></p>
          <p className="text-[10px] text-text-light">回数券</p>
        </div>
      </div>
      <div className="border-t border-border pt-2 text-center">
        <p className="text-xl font-bold text-accent">{total.toLocaleString()}円</p>
      </div>
    </div>
  );
}
