"use client";

type Menu = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
};

type Props = {
  menus: Menu[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function BookingMenuSelector({ menus, selectedIds, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  const selectedMenus = menus.filter((m) => selectedIds.includes(m.id));
  const totalPrice = selectedMenus.reduce((s, m) => s + (m.price ?? 0), 0);
  const totalDuration = selectedMenus.reduce((s, m) => s + (m.duration_minutes ?? 60), 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-light">
        ご希望のメニューを選択してください（複数選択可）
      </p>

      <div className="space-y-2">
        {menus.map((menu) => {
          const isSelected = selectedIds.includes(menu.id);
          return (
            <button
              key={menu.id}
              type="button"
              onClick={() => toggle(menu.id)}
              className={`w-full text-left rounded-xl border p-4 transition-colors min-h-[48px] ${
                isSelected
                  ? "border-accent bg-accent/5"
                  : "border-border bg-surface hover:border-accent/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{menu.name}</p>
                  <p className="text-sm text-text-light mt-0.5">
                    {menu.duration_minutes}分
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-accent whitespace-nowrap">
                    &yen;{menu.price?.toLocaleString()}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "border-accent bg-accent" : "border-border"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-text-light">
            {selectedIds.length}件選択 / 合計 {totalDuration}分
          </span>
          <span className="font-bold text-accent">
            &yen;{totalPrice.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
