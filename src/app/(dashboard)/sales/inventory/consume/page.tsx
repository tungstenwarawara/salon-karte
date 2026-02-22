"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];

const LOG_TYPES = [
  { value: "sample_out", label: "サンプル消費" },
  { value: "waste_out", label: "廃棄" },
  { value: "return_in", label: "返品（入庫）" },
];

export default function ConsumePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const [form, setForm] = useState({
    product_id: "",
    log_type: "sample_out",
    quantity: "1",
    reason: "",
    logged_at: today,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
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

    const { data } = await supabase
      .from("products")
      .select("id, name, category")
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .order("name")
      .returns<Product[]>();

    setProducts(data ?? []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id) {
      setError("商品を選択してください");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    const supabase = createClient();
    const quantity = parseInt(form.quantity) || 1;
    if (quantity <= 0) {
      setError("数量は1以上を入力してください");
      setLoading(false);
      return;
    }
    const isReturn = form.log_type === "return_in";

    // 消費・廃棄の場合は在庫不足チェック
    if (!isReturn) {
      const { data: summary } = await supabase
        .rpc("get_inventory_summary", { p_salon_id: salonId })
        .returns<{ product_id: string; current_stock: number }[]>();
      const productStock = summary?.find((s) => s.product_id === form.product_id);
      const currentStock = productStock?.current_stock ?? 0;
      if (quantity > currentStock) {
        setError(`在庫が不足しています（現在庫: ${currentStock}個）`);
        setLoading(false);
        return;
      }
    }

    const { error: insertError } = await supabase.from("inventory_logs").insert({
      salon_id: salonId,
      product_id: form.product_id,
      log_type: form.log_type,
      quantity: isReturn ? quantity : -quantity, // 返品は正数、消費・廃棄は負数
      reason: form.reason || null,
      logged_at: form.logged_at,
    });

    if (insertError) {
      setError("記録の登録に失敗しました");
      setLoading(false);
      return;
    }

    setLoading(false);
    const product = products.find((p) => p.id === form.product_id);
    const typeLabel = LOG_TYPES.find((t) => t.value === form.log_type)?.label ?? "";
    setSuccess(`${product?.name ?? "商品"} ${quantity}個 の${typeLabel}を記録しました`);

    // フォームリセット
    setForm({
      product_id: "",
      log_type: form.log_type,
      quantity: "1",
      reason: "",
      logged_at: form.logged_at,
    });
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  return (
    <div className="space-y-4">
      <PageHeader
        title="消費・廃棄記録"
        breadcrumbs={[
          { label: "経営", href: "/sales" },
          { label: "在庫管理", href: "/sales/inventory" },
          { label: "消費・廃棄記録" },
        ]}
      />

      {error && <ErrorAlert message={error} />}

      {success && (
        <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-xs underline"
          >
            閉じる
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            種別 <span className="text-error">*</span>
          </label>
          <div className="flex gap-1.5">
            {LOG_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm({ ...form, log_type: type.value })}
                className={`flex-1 text-sm font-medium py-2.5 rounded-xl transition-colors min-h-[44px] ${
                  form.log_type === type.value
                    ? "bg-accent text-white"
                    : "bg-background border border-border text-text-light"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            商品 <span className="text-error">*</span>
          </label>
          <select
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            required
            className={inputClass}
          >
            <option value="">商品を選択</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
                {product.category ? ` (${product.category})` : ""}
              </option>
            ))}
          </select>
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
            <label className="block text-sm font-medium mb-1.5">日付</label>
            <input
              type="date"
              value={form.logged_at}
              onChange={(e) => setForm({ ...form, logged_at: e.target.value })}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">理由メモ</label>
          <AutoResizeTextarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="理由や詳細を記録（任意）"
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
            戻る
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "記録中..." : "記録する"}
          </button>
        </div>
      </form>

      {products.length === 0 && (
        <div className="text-center text-text-light text-sm py-4">
          商品が登録されていません。先に
          <a href="/sales/inventory/products" className="text-accent hover:underline">商品マスタ</a>
          から登録してください。
        </div>
      )}
    </div>
  );
}
