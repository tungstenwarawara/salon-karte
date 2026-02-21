"use client";

import type { Menu, MenuPaymentInfo } from "./types";

type Props = {
  menus: Menu[];
  selectedMenuIds: string[];
  menuPayments: MenuPaymentInfo[];
  onToggle: (menuId: string) => void;
};

export function MenuSelector({ menus, selectedMenuIds, menuPayments, onToggle }: Props) {
  const totalDuration = selectedMenuIds.reduce((sum, id) => {
    const menu = menus.find((m) => m.id === id);
    return sum + (menu?.duration_minutes ?? 0);
  }, 0);
  const totalPrice = selectedMenuIds.reduce((sum, id) => {
    const menu = menus.find((m) => m.id === id);
    const payment = menuPayments.find((mp) => mp.menuId === id);
    return sum + (payment?.priceOverride ?? menu?.price ?? 0);
  }, 0);

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        施術メニュー（複数選択可）
      </label>
      {menus.length > 0 ? (
        <div className="bg-background border border-border rounded-xl p-3 max-h-64 overflow-y-auto space-y-1">
          {menus.map((m) => {
            const isSelected = selectedMenuIds.includes(m.id);
            return (
              <label
                key={m.id}
                className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors cursor-pointer ${
                  isSelected ? "bg-accent/5" : "hover:bg-surface"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(m.id)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
                />
                <span className="text-sm flex-1">
                  {m.name}{!m.is_active ? "（非アクティブ）" : ""}
                </span>
                <span className="text-xs text-text-light whitespace-nowrap">
                  {m.duration_minutes ? `${m.duration_minutes}分` : ""}
                  {m.duration_minutes && m.price ? " / " : ""}
                  {m.price ? `${m.price.toLocaleString()}円` : ""}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="bg-background border border-border rounded-xl p-3 text-sm text-text-light text-center">
          メニューが登録されていません
        </div>
      )}
      {selectedMenuIds.length > 0 && (
        <p className="text-xs text-text-light mt-1.5">
          選択中: {selectedMenuIds.length}件
          {totalDuration > 0 && ` / 合計 ${totalDuration}分`}
          {totalPrice > 0 && ` / ${totalPrice.toLocaleString()}円`}
        </p>
      )}
    </div>
  );
}
