import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];

type MenuCardProps = {
  menu: Menu;
  onEdit: (menu: Menu) => void;
  onToggleActive: (menuId: string, currentActive: boolean) => void;
  onDelete: (menuId: string) => void;
};

/** 施術メニュー一覧のカード表示 */
export function MenuCard({ menu, onEdit, onToggleActive, onDelete }: MenuCardProps) {
  return (
    <div
      className={`bg-surface border rounded-xl p-4 ${menu.is_active ? "border-border" : "border-border opacity-60"}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{menu.name}</p>
            {!menu.is_active && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">
                非表示
              </span>
            )}
          </div>
          <div className="flex gap-3 mt-1 text-sm text-text-light">
            {menu.category && <span>{menu.category}</span>}
            {menu.duration_minutes && <span>{menu.duration_minutes}分</span>}
            {menu.price && <span>{menu.price.toLocaleString()}円</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          {/* 表示切替トグル */}
          <button
            onClick={() => onToggleActive(menu.id, menu.is_active)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${menu.is_active ? "bg-accent" : "bg-gray-200"}`}
            aria-label={menu.is_active ? "非表示にする" : "表示にする"}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${menu.is_active ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          <button
            onClick={() => onEdit(menu)}
            className="text-sm text-accent hover:underline min-h-[48px] flex items-center"
          >
            編集
          </button>
          <button
            onClick={() => onDelete(menu.id)}
            className="text-sm text-error hover:underline min-h-[48px] flex items-center"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
