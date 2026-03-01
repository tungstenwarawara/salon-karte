"use client";

import type { Database } from "@/types/database";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

type EditFormData = { item_name: string; quantity: number; unit_price: number; memo: string };

type Props = {
  purchase: Purchase;
  editForm: EditFormData;
  saving: boolean;
  onUpdate: (field: string, value: string | number) => void;
  onSave: () => void;
  onCancel: () => void;
};

/** 物販インライン編集フォーム */
export function PurchaseEditForm({
  purchase, editForm, saving, onUpdate, onSave, onCancel,
}: Props) {
  const isProductLinked = !!purchase.product_id;
  const inputClass = "w-full text-sm rounded-lg border border-border bg-surface px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/50";

  return (
    <div className="bg-background rounded-xl p-3 space-y-2">
      {isProductLinked ? (
        <>
          <p className="text-sm font-medium">{purchase.item_name}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-text-light mb-0.5">数量</label>
              <input type="number" min={1} value={editForm.quantity}
                onChange={(e) => onUpdate("quantity", parseInt(e.target.value, 10) || 1)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-text-light mb-0.5">単価（円）</label>
              <input type="number" min={0} value={editForm.unit_price}
                onChange={(e) => onUpdate("unit_price", parseInt(e.target.value, 10) || 0)} className={inputClass} />
            </div>
          </div>
          {editForm.quantity !== purchase.quantity && (
            <p className="text-xs text-accent">在庫が自動調整されます</p>
          )}
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs text-text-light mb-0.5">商品名</label>
            <input type="text" value={editForm.item_name}
              onChange={(e) => onUpdate("item_name", e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-text-light mb-0.5">数量</label>
              <input type="number" min={1} value={editForm.quantity}
                onChange={(e) => onUpdate("quantity", parseInt(e.target.value, 10) || 1)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-text-light mb-0.5">単価（円）</label>
              <input type="number" min={0} value={editForm.unit_price}
                onChange={(e) => onUpdate("unit_price", parseInt(e.target.value, 10) || 0)} className={inputClass} />
            </div>
          </div>
        </>
      )}
      <input type="text" value={editForm.memo} onChange={(e) => onUpdate("memo", e.target.value)}
        placeholder="メモ（任意）" className={inputClass} />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-surface transition-colors min-h-[44px]">
          キャンセル
        </button>
        <button type="button" onClick={onSave} disabled={saving}
          className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg hover:bg-accent-light transition-colors min-h-[44px] disabled:opacity-50">
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}
