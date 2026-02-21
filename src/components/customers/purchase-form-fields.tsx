"use client";

import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type InputMode = "product" | "free";

interface PurchaseForm {
  purchase_date: string;
  product_id: string;
  item_name: string;
  quantity: string;
  unit_price: string;
  memo: string;
}

interface PurchaseFormFieldsProps {
  form: PurchaseForm;
  products: Product[];
  inputMode: InputMode;
  remainingStock: number | null;
  totalPrice: number;
  quantityNum: number;
  unitPriceNum: number;
  onFormChange: (updater: (prev: PurchaseForm) => PurchaseForm) => void;
  onProductChange: (productId: string) => void;
  onInputModeChange: (mode: InputMode) => void;
  inputClass: string;
}

/** 物販記録フォームのフィールド部分 */
export function PurchaseFormFields({
  form,
  products,
  inputMode,
  remainingStock,
  totalPrice,
  onFormChange,
  onProductChange,
  onInputModeChange,
  inputClass,
}: PurchaseFormFieldsProps) {
  return (
    <>
      {/* モード切替（商品がある場合のみ表示） */}
      {products.length > 0 && (
        <div className="flex gap-1.5 bg-background rounded-xl p-1">
          <button
            type="button"
            onClick={() => onInputModeChange("product")}
            className={`flex-1 text-center text-sm font-medium py-2.5 rounded-lg transition-colors min-h-[44px] ${
              inputMode === "product"
                ? "bg-accent text-white shadow-sm"
                : "text-text-light hover:text-text"
            }`}
          >
            商品から選ぶ
          </button>
          <button
            type="button"
            onClick={() => onInputModeChange("free")}
            className={`flex-1 text-center text-sm font-medium py-2.5 rounded-lg transition-colors min-h-[44px] ${
              inputMode === "free"
                ? "bg-accent text-white shadow-sm"
                : "text-text-light hover:text-text"
            }`}
          >
            自由入力
          </button>
        </div>
      )}

      {/* 購入日 */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          購入日 <span className="text-error">*</span>
        </label>
        <input
          type="date"
          value={form.purchase_date}
          onChange={(e) =>
            onFormChange((prev) => ({ ...prev, purchase_date: e.target.value }))
          }
          required
          className={inputClass}
        />
      </div>

      {/* 商品選択 / 自由入力 */}
      {inputMode === "product" ? (
        <div>
          <label className="block text-sm font-medium mb-1.5">
            商品 <span className="text-error">*</span>
          </label>
          <select
            value={form.product_id}
            onChange={(e) => onProductChange(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">商品を選択</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
                {product.category ? ` (${product.category})` : ""}
                {` - ¥${product.base_sell_price.toLocaleString()}`}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1.5">
            商品名 <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={form.item_name}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, item_name: e.target.value }))
            }
            placeholder="例: モイスチャークリーム"
            required
            className={inputClass}
          />
        </div>
      )}

      {/* 数量・単価 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">数量</label>
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, quantity: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            単価（円）
          </label>
          <input
            type="number"
            min={0}
            value={form.unit_price}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, unit_price: e.target.value }))
            }
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      {/* 合計金額 */}
      <div className="bg-background rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-text-light">合計金額</span>
        <span className="text-lg font-bold text-accent">
          {totalPrice.toLocaleString()}円
        </span>
      </div>

      {/* 残り在庫（商品モード登録後） */}
      {remainingStock !== null && (
        <div className="bg-blue-50 text-blue-700 text-sm rounded-xl px-4 py-3">
          残り在庫: {remainingStock}個
        </div>
      )}

      {/* メモ */}
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
