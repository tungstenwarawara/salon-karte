import { formatYen } from "@/components/sales/sales-types";

export type MenuRanking = {
  menu_name: string;
  count: number;
  revenue: number;
};

type Props = {
  menus: MenuRanking[];
};

export function TreatmentRanking({ menus }: Props) {
  if (menus.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-light">
        <p className="text-sm">施術記録を登録するとランキングが表示されます</p>
      </div>
    );
  }

  const maxCount = Math.max(...menus.map((m) => m.count), 1);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
      <h3 className="text-xs font-bold text-text-light uppercase tracking-wide">人気メニュー</h3>
      <div className="space-y-2">
        {menus.map((m, i) => (
          <div key={m.menu_name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-light w-5 text-right">{i + 1}</span>
                <span className="text-sm">{m.menu_name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-light">{m.count}回</span>
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
