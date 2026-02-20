"use client";

import { useState } from "react";
import { INPUT_CLASS, type PendingPurchase, type Product } from "./types";

type Props = {
  products: Product[];
  onAdd: (purchase: PendingPurchase) => void;
};

export function PurchaseInlineForm({ products, onAdd }: Props) {
  const [mode, setMode] = useState<"product" | "free">(products.length > 0 ? "product" : "free");
  const [productId, setProductId] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [memo, setMemo] = useState("");

  const handleProductChange = (pid: string) => {
    const product = products.find((p) => p.id === pid);
    setProductId(pid);
    if (product) {
      setItemName(product.name);
      setUnitPrice(product.base_sell_price.toString());
    }
  };

  const handleAdd = () => {
    if (mode === "product" && !productId) return;
    if (mode === "free" && !itemName.trim()) return;
    const q = Math.max(1, parseInt(quantity, 10) || 1);
    const up = Math.max(0, parseInt(unitPrice, 10) || 0);
    onAdd({
      mode,
      product_id: mode === "product" ? productId : null,
      item_name: mode === "product" ? (products.find((p) => p.id === productId)?.name ?? "") : itemName.trim(),
      quantity: q,
      unit_price: up,
      memo,
    });
    setProductId("");
    setItemName("");
    setQuantity("1");
    setUnitPrice("");
    setMemo("");
  };

  const canAdd = mode === "product" ? !!productId : !!itemName.trim();

  return (
    <div className="space-y-3">
      {/* モード切替 */}
      {products.length > 0 && (
        <div className="flex gap-1 bg-background rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => setMode("product")}
            className={`flex-1 text-center text-xs font-medium py-2 rounded-lg transition-colors min-h-[36px] ${
              mode === "product" ? "bg-accent text-white shadow-sm" : "text-text-light hover:text-text"
            }`}
          >
            商品から選ぶ
          </button>
          <button
            type="button"
            onClick={() => setMode("free")}
            className={`flex-1 text-center text-xs font-medium py-2 rounded-lg transition-colors min-h-[36px] ${
              mode === "free" ? "bg-accent text-white shadow-sm" : "text-text-light hover:text-text"
            }`}
          >
            自由入力
          </button>
        </div>
      )}

      {mode === "product" ? (
        <select
          value={productId}
          onChange={(e) => handleProductChange(e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">商品を選択</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}{product.category ? ` (${product.category})` : ""} - ¥{product.base_sell_price.toLocaleString()}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="商品名"
          className={INPUT_CLASS}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-light mb-1">数量</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-xs text-text-light mb-1">単価（円）</label>
          <input
            type="number"
            min={0}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {unitPrice && quantity && (
        <div className="flex items-center justify-between bg-background rounded-xl px-3 py-2">
          <span className="text-xs text-text-light">小計</span>
          <span className="text-sm font-medium">
            {(Math.max(1, parseInt(quantity, 10) || 1) * Math.max(0, parseInt(unitPrice, 10) || 0)).toLocaleString()}円
          </span>
        </div>
      )}

      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="メモ（任意）"
        className={INPUT_CLASS}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        className="w-full bg-accent/10 text-accent text-sm font-medium rounded-xl py-2.5 hover:bg-accent/20 transition-colors disabled:opacity-50 min-h-[44px]"
      >
        + 物販を追加
      </button>
    </div>
  );
}
