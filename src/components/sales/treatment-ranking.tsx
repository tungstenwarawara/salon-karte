import { formatYen } from "@/components/sales/sales-types";

// 汎用ランキングアイテム型
export type RankingItem = {
  name: string;
  count: number;
  revenue: number;
};

// 汎用ランキングカード
type RankingCardProps = {
  title: string;
  items: RankingItem[];
  unit: string;
  emptyMessage: string;
};

export function RankingCard({ title, items, unit, emptyMessage }: RankingCardProps) {
  if (items.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-light">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const maxCount = Math.max(...items.map((m) => m.count), 1);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
      <h3 className="text-xs font-bold text-text-light uppercase tracking-wide">{title}</h3>
      <div className="space-y-2">
        {items.map((m, i) => (
          <div key={m.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-light w-5 text-right">{i + 1}</span>
                <span className="text-sm">{m.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-light">{m.count}{unit}</span>
                <span className="text-xs text-text-light ml-2">{formatYen(m.revenue)}</span>
              </div>
            </div>
            <div className="ml-7 h-1.5 bg-border/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${(m.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 後方互換ラッパー（既存import維持）
export type MenuRanking = {
  menu_name: string;
  count: number;
  revenue: number;
};

export function TreatmentRanking({ menus }: { menus: MenuRanking[] }) {
  const items = menus.map((m) => ({ name: m.menu_name, count: m.count, revenue: m.revenue }));
  return (
    <RankingCard
      title="人気メニュー"
      items={items}
      unit="回"
      emptyMessage="施術記録を登録するとランキングが表示されます"
    />
  );
}
