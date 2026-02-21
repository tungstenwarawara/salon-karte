"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { setFlashToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type InputMode = "product" | "free";

export default function NewPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [salonId, setSalonId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("product");
  const [remainingStock, setRemainingStock] = useState<number | null>(null);

  const [form, setForm] = useState(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      purchase_date: today,
      product_id: "",
      item_name: "",
      quantity: "1",
      unit_price: "",
      memo: "",
    };
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: salon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", user.id)
        .single<{ id: string }>();
      if (!salon) return;
      setSalonId(salon.id);

      // 顧客名と商品を並列取得
      const [customerRes, productsRes] = await Promise.all([
        supabase
          .from("customers")
          .select("last_name, first_name")
          .eq("id", customerId)
          .single<{ last_name: string; first_name: string }>(),
        supabase
          .from("products")
          .select("id, name, category, base_sell_price")
          .eq("salon_id", salon.id)
          .eq("is_active", true)
          .order("name")
          .returns<Product[]>(),
      ]);

      if (customerRes.data) {
        setCustomerName(`${customerRes.data.last_name} ${customerRes.data.first_name}`);
      }

      const productList = productsRes.data ?? [];
      setProducts(productList);

      // 商品がなければ自由入力モードに自動切替
      if (productList.length === 0) {
        setInputMode("free");
      }
    };
    load();
  }, [customerId]);

  // 商品選択時に売価を自動セット
  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setForm((prev) => ({
      ...prev,
      product_id: productId,
      unit_price: product ? product.base_sell_price.toString() : "",
    }));
    setRemainingStock(null);
  };

  const quantityNum = Math.max(1, parseInt(form.quantity, 10) || 0);
  const unitPriceNum = Math.max(0, parseInt(form.unit_price, 10) || 0);
  const totalPrice = quantityNum * unitPriceNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === "product" && !form.product_id) {
      setError("商品を選択してください");
      return;
    }
    if (inputMode === "free" && !form.item_name.trim()) {
      setError("商品名を入力してください");
      return;
    }
    if (!salonId) {
      setError("サロン情報の読み込み中です。しばらくお待ちください。");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();

    if (inputMode === "product") {
      // 商品モード: RPC で在庫連動
      const { data, error: rpcError } = await supabase.rpc("record_product_sale", {
        p_salon_id: salonId,
        p_customer_id: customerId,
        p_product_id: form.product_id,
        p_quantity: quantityNum,
        p_sell_price: unitPriceNum,
        p_purchase_date: form.purchase_date,
        p_memo: form.memo || null,
      });

      if (rpcError) {
        setError("登録に失敗しました");
        setLoading(false);
        return;
      }

      // 残り在庫を表示
      const result = data as { purchase_id: string; remaining_stock: number } | null;
      if (result) {
        setRemainingStock(result.remaining_stock);
      }
    } else {
      // 自由入力モード: 既存の挙動
      const { error: insertError } = await supabase.from("purchases").insert({
        salon_id: salonId,
        customer_id: customerId,
        purchase_date: form.purchase_date,
        item_name: form.item_name.trim(),
        quantity: quantityNum,
        unit_price: unitPriceNum,
        total_price: totalPrice,
        memo: form.memo || null,
      });

      if (insertError) {
        setError("登録に失敗しました");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setFlashToast("物販を記録しました");
    router.push(`/customers/${customerId}`);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  return (
    <div className="space-y-4">
      <PageHeader
        title="購入記録を登録"
        backLabel="戻る"
        breadcrumbs={[
          ...(customerName ? [{ label: customerName, href: `/customers/${customerId}` }] : []),
          { label: "物販記録" },
        ]}
      />
      {customerName && (
        <p className="text-text-light">
          顧客: <span className="font-medium text-text">{customerName}</span>
        </p>
      )}

      {/* Mode toggle (only show if products exist) */}
      {products.length > 0 && (
        <div className="flex gap-1.5 bg-background rounded-xl p-1">
          <button
            type="button"
            onClick={() => setInputMode("product")}
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
            onClick={() => setInputMode("free")}
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

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-2xl p-5 space-y-4"
      >
        {error && <ErrorAlert message={error} />}

        <div>
          <label className="block text-sm font-medium mb-1.5">
            購入日 <span className="text-error">*</span>
          </label>
          <input
            type="date"
            value={form.purchase_date}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, purchase_date: e.target.value }))
            }
            required
            className={inputClass}
          />
        </div>

        {inputMode === "product" ? (
          /* 商品選択モード */
          <div>
            <label className="block text-sm font-medium mb-1.5">
              商品 <span className="text-error">*</span>
            </label>
            <select
              value={form.product_id}
              onChange={(e) => handleProductChange(e.target.value)}
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
          /* 自由入力モード */
          <div>
            <label className="block text-sm font-medium mb-1.5">
              商品名 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.item_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, item_name: e.target.value }))
              }
              placeholder="例: モイスチャークリーム"
              required
              className={inputClass}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">数量</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  quantity: e.target.value,
                }))
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
                setForm((prev) => ({
                  ...prev,
                  unit_price: e.target.value,
                }))
              }
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>

        <div className="bg-background rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text-light">合計金額</span>
          <span className="text-lg font-bold text-accent">
            {totalPrice.toLocaleString()}円
          </span>
        </div>

        {remainingStock !== null && (
          <div className="bg-blue-50 text-blue-700 text-sm rounded-xl px-4 py-3">
            残り在庫: {remainingStock}個
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">
            メモ（任意）
          </label>
          <AutoResizeTextarea
            value={form.memo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, memo: e.target.value }))
            }
            placeholder="備考があれば記入"
            minRows={2}
            className={inputClass}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
