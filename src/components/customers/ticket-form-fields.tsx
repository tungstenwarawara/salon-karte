"use client";

import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];

interface TicketForm {
  ticket_name: string;
  total_sessions: string;
  purchase_date: string;
  expiry_date: string;
  price: string;
  memo: string;
}

interface TicketFormFieldsProps {
  form: TicketForm;
  menus: Menu[];
  mode: "menu" | "free";
  selectedMenuId: string;
  totalSessionsNum: number;
  referencePrice: number | null;
  selectedMenu: Menu | undefined;
  onFormChange: (updater: (prev: TicketForm) => TicketForm) => void;
  onMenuChange: (menuId: string) => void;
  onSessionsChange: (value: string) => void;
  onModeChange: (mode: "menu" | "free") => void;
  inputClass: string;
}

/** 回数券登録フォームのフィールド部分 */
export function TicketFormFields(props: TicketFormFieldsProps) {
  const {
    form, menus, mode, selectedMenuId, totalSessionsNum,
    referencePrice, selectedMenu, onFormChange, onMenuChange,
    onSessionsChange, onModeChange, inputClass,
  } = props;
  return (
    <>
      {menus.length > 0 && (
        <div className="flex gap-1 bg-background rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => onModeChange("menu")}
            className={`flex-1 text-center text-sm font-medium py-2 rounded-lg transition-colors min-h-[44px] ${
              mode === "menu"
                ? "bg-accent text-white shadow-sm"
                : "text-text-light hover:text-text"
            }`}
          >
            メニューから作成
          </button>
          <button
            type="button"
            onClick={() => onModeChange("free")}
            className={`flex-1 text-center text-sm font-medium py-2 rounded-lg transition-colors min-h-[44px] ${
              mode === "free"
                ? "bg-accent text-white shadow-sm"
                : "text-text-light hover:text-text"
            }`}
          >
            自由入力
          </button>
        </div>
      )}

      {mode === "menu" && menus.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1.5">メニュー</label>
          <select
            value={selectedMenuId}
            onChange={(e) => onMenuChange(e.target.value)}
            className={inputClass}
          >
            <option value="">メニューを選択</option>
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
                {menu.category ? ` (${menu.category})` : ""}
                {menu.price ? ` - ¥${menu.price.toLocaleString()}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">
          チケット名 <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={form.ticket_name}
          onChange={(e) =>
            onFormChange((prev) => ({ ...prev, ticket_name: e.target.value }))
          }
          placeholder={
            mode === "menu"
              ? "メニューを選択すると自動入力されます"
              : "例: フェイシャル5回コース"
          }
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            回数 <span className="text-error">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={form.total_sessions}
            onChange={(e) => onSessionsChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            金額（円）
          </label>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, price: e.target.value }))
            }
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      {mode === "menu" && referencePrice != null && (
        <div className="flex items-center justify-between bg-background rounded-xl px-3 py-2">
          <span className="text-xs text-text-light">定価参考</span>
          <span className="text-xs text-text-light">
            ¥{(selectedMenu?.price ?? 0).toLocaleString()} × {totalSessionsNum}回
            = ¥{referencePrice.toLocaleString()}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">購入日</label>
          <input
            type="date"
            value={form.purchase_date}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, purchase_date: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            有効期限（任意）
          </label>
          <input
            type="date"
            value={form.expiry_date}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, expiry_date: e.target.value }))
            }
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          メモ（任意）
        </label>
        <AutoResizeTextarea
          value={form.memo}
          onChange={(e) =>
            onFormChange((prev) => ({ ...prev, memo: e.target.value }))
          }
          placeholder="備考があれば記入"
          minRows={2}
          className={inputClass}
        />
      </div>
    </>
  );
}
