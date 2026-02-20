"use client";

import type { TreatmentMenu } from "./types";

type Props = {
  menus: TreatmentMenu[];
  selectedMenuIds: string[];
  onToggle: (menuId: string) => void;
  totalDuration: number;
  totalPrice: number;
};

export function AppointmentMenuSelector({
  menus,
  selectedMenuIds,
  onToggle,
  totalDuration,
  totalPrice,
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        施術メニュー（任意・複数選択可）
      </label>
      {menus.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl p-3 max-h-52 overflow-y-auto space-y-1">
          {menus.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-background transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedMenuIds.includes(m.id)}
                onChange={() => onToggle(m.id)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
              />
              <span className="text-sm flex-1">{m.name}</span>
              <span className="text-xs text-text-light whitespace-nowrap">
                {m.duration_minutes ? `${m.duration_minutes}分` : ""}
                {m.duration_minutes && m.price ? " / " : ""}
                {m.price ? `${m.price.toLocaleString()}円` : ""}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-3 text-sm text-text-light text-center">
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
