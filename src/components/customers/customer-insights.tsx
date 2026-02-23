type InsightItem = {
  name: string;
  count: number;
  unit: string;
};

type Props = {
  topMenus: InsightItem[];
  topProducts: InsightItem[];
  treatmentTotal: number;
  purchaseTotal: number;
  courseTicketTotal: number;
};

function MiniRanking({ title, items, emptyMessage }: { title: string; items: InsightItem[]; emptyMessage: string }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-text-light mb-1.5">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-text-light">{emptyMessage}</p>
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-light w-4 text-right">{i + 1}.</span>
                <span className="truncate">{item.name}</span>
              </div>
              <span className="text-xs text-text-light shrink-0 ml-2">{item.count}{item.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CustomerInsights({
  topMenus,
  topProducts,
  treatmentTotal,
  purchaseTotal,
  courseTicketTotal,
}: Props) {
  const grandTotal = treatmentTotal + purchaseTotal + courseTicketTotal;

  // 全データがゼロなら非表示
  if (topMenus.length === 0 && topProducts.length === 0 && grandTotal <= 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-sm text-text-light">顧客インサイト</h3>

      <MiniRanking title="よく選ぶメニュー" items={topMenus} emptyMessage="施術記録がありません" />

      <MiniRanking title="よく買う商品" items={topProducts} emptyMessage="購入記録がありません" />

      {grandTotal > 0 && (
        <div>
          <h4 className="text-xs font-bold text-text-light mb-1.5">売上サマリー（累計）</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-light">施術</span>
              <span>{treatmentTotal.toLocaleString()}円</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-light">物販</span>
              <span>{purchaseTotal.toLocaleString()}円</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-light">回数券</span>
              <span>{courseTicketTotal.toLocaleString()}円</span>
            </div>
            <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold">
              <span>合計</span>
              <span className="text-accent">{grandTotal.toLocaleString()}円</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
