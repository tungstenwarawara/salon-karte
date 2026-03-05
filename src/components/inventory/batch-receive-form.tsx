"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ProductCombobox } from "@/components/ui/product-combobox";

type Product = { id: string; name: string; category: string | null; base_cost_price: number };
type SessionItem = { id: string; product_name: string; quantity: number; unit_cost_price: number };
type Props = { salonId: string; products: Product[]; presetProductId: string | null };

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

export function BatchReceiveForm({ salonId, products, presetProductId }: Props) {
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const getInitialForm = (productId?: string) => {
    const product = productId ? products.find((p) => p.id === productId) : null;
    return {
      product_id: productId ?? "",
      quantity: "1",
      unit_cost_price: product?.base_cost_price != null ? product.base_cost_price.toString() : "",
      logged_at: today,
    };
  };

  const [form, setForm] = useState(getInitialForm(presetProductId ?? undefined));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setForm((prev) => ({
      ...prev,
      product_id: productId,
      unit_cost_price: product?.base_cost_price != null ? product.base_cost_price.toString() : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id) {
      setError("商品を選択してください");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const quantity = Math.max(1, parseInt(form.quantity) || 1);
    const unitCostPrice = form.unit_cost_price ? parseInt(form.unit_cost_price) : 0;

    const { data, error: insertError } = await supabase
      .from("inventory_logs")
      .insert({
        salon_id: salonId,
        product_id: form.product_id,
        log_type: "purchase_in",
        quantity: quantity,
        unit_cost_price: unitCostPrice,
        logged_at: form.logged_at,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(`仕入記録の登録に失敗しました: ${insertError.message}`);
      setLoading(false);
      return;
    }

    const product = products.find((p) => p.id === form.product_id);
    setSessionItems((prev) => [
      {
        id: data.id,
        product_name: product?.name ?? "不明",
        quantity,
        unit_cost_price: unitCostPrice,
      },
      ...prev,
    ]);

    // フォームリセット（日付はそのまま）
    setForm({
      product_id: "",
      quantity: "1",
      unit_cost_price: "",
      logged_at: form.logged_at,
    });
    setLoading(false);
  };

  const sessionTotal = sessionItems.reduce(
    (sum, i) => sum + i.quantity * i.unit_cost_price,
    0
  );

  return (
    <div className="space-y-4">
      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            商品 <span className="text-error">*</span>
          </label>
          <ProductCombobox
            products={products}
            selectedId={form.product_id}
            onSelect={handleProductChange}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              数量 <span className="text-error">*</span>
            </label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              min="1"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">仕入単価（円）</label>
            <input
              type="number"
              value={form.unit_cost_price}
              onChange={(e) => setForm({ ...form, unit_cost_price: e.target.value })}
              placeholder="自動入力"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">仕入日</label>
          <input
            type="date"
            value={form.logged_at}
            onChange={(e) => setForm({ ...form, logged_at: e.target.value })}
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
        >
          {loading ? "保存中..." : sessionItems.length > 0 ? "追加する" : "保存する"}
        </button>
      </form>

      {/* セッション内の登録一覧 */}
      {sessionItems.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
          <h4 className="text-sm font-medium text-text-light">
            今回の仕入記録（{sessionItems.length}件）
          </h4>
          {sessionItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="truncate flex-1 min-w-0">
                {item.product_name} x{item.quantity}
              </span>
              <span className="tabular-nums shrink-0 ml-2">
                ¥{(item.quantity * item.unit_cost_price).toLocaleString()}
              </span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
            <span>合計</span>
            <span className="tabular-nums">¥{sessionTotal.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
