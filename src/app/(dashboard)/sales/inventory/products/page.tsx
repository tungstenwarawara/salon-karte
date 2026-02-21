"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [salonId, setSalonId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    category: "",
    base_sell_price: "",
    base_cost_price: "",
    reorder_point: "3",
    memo: "",
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
      .select("id, name, category, base_sell_price, base_cost_price, reorder_point, memo, is_active, created_at")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: true })
      .returns<Product[]>();

    setProducts(data ?? []);
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      base_sell_price: "",
      base_cost_price: "",
      reorder_point: "3",
      memo: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const payload = {
      name: form.name,
      category: form.category || null,
      base_sell_price: form.base_sell_price ? parseInt(form.base_sell_price) : 0,
      base_cost_price: form.base_cost_price ? parseInt(form.base_cost_price) : 0,
      reorder_point: form.reorder_point ? parseInt(form.reorder_point) : 3,
      memo: form.memo || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId)
        .eq("salon_id", salonId);
      if (error) {
        setError("商品の更新に失敗しました");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("products")
        .insert({ ...payload, salon_id: salonId });
      if (error) {
        setError("商品の追加に失敗しました");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    resetForm();
    showToast(editingId ? "商品を更新しました" : "商品を追加しました");
    loadProducts();
  };

  const startEdit = (product: Product) => {
    setForm({
      name: product.name,
      category: product.category ?? "",
      base_sell_price: product.base_sell_price?.toString() ?? "",
      base_cost_price: product.base_cost_price?.toString() ?? "",
      reorder_point: product.reorder_point?.toString() ?? "3",
      memo: product.memo ?? "",
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    setError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ is_active: !currentActive })
      .eq("id", productId)
      .eq("salon_id", salonId);
    if (error) {
      setError("ステータスの変更に失敗しました");
      return;
    }
    loadProducts();
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("この商品を削除しますか？在庫ログも削除されます。")) return;
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", productId).eq("salon_id", salonId);
    if (error) {
      setError("商品の削除に失敗しました。在庫ログがある場合は非表示にしてください。");
      return;
    }
    loadProducts();
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title="商品マスタ"
        backLabel="在庫管理"
        backHref="/sales/inventory"
        breadcrumbs={[
          { label: "経営", href: "/sales" },
          { label: "在庫管理", href: "/sales/inventory" },
          { label: "商品マスタ" },
        ]}
      >
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[48px]"
          >
            + 追加
          </button>
        )}
      </PageHeader>

      {error && <ErrorAlert message={error} />}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold">
            {editingId ? "商品を編集" : "商品を追加"}
          </h3>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              商品名 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="例: モイスチャー美容液"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              カテゴリ
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="例: スキンケア、ヘアケア"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                売価（円）
              </label>
              <input
                type="number"
                value={form.base_sell_price}
                onChange={(e) => setForm({ ...form, base_sell_price: e.target.value })}
                placeholder="5000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                仕入価（円）
              </label>
              <input
                type="number"
                value={form.base_cost_price}
                onChange={(e) => setForm({ ...form, base_cost_price: e.target.value })}
                placeholder="2500"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              発注点（残りこの数以下で通知）
            </label>
            <input
              type="number"
              value={form.reorder_point}
              onChange={(e) => setForm({ ...form, reorder_point: e.target.value })}
              placeholder="3"
              min="0"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">メモ</label>
            <AutoResizeTextarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="仕入先など自由メモ"
              minRows={2}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              {loading ? "保存中..." : editingId ? "更新する" : "追加する"}
            </button>
          </div>
        </form>
      )}

      {/* Product list */}
      {products.length > 0 ? (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-surface border rounded-xl p-4 ${product.is_active ? "border-border" : "border-border opacity-60"}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{product.name}</p>
                    {!product.is_active && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">非表示</span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 text-sm text-text-light flex-wrap">
                    {product.category && <span>{product.category}</span>}
                    <span>売価 ¥{product.base_sell_price.toLocaleString()}</span>
                    <span>仕入 ¥{product.base_cost_price.toLocaleString()}</span>
                    <span>発注点 {product.reorder_point}個</span>
                  </div>
                  {product.memo && (
                    <p className="text-xs text-text-light mt-1">{product.memo}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <button
                    onClick={() => handleToggleActive(product.id, product.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.is_active ? "bg-accent" : "bg-gray-200"}`}
                    aria-label={product.is_active ? "非表示にする" : "表示にする"}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.is_active ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <button
                    onClick={() => startEdit(product)}
                    className="text-sm text-accent hover:underline"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-sm text-error hover:underline"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-text-light">商品が登録されていません</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block mt-2 text-sm text-accent hover:underline font-medium"
            >
              最初の商品を追加する →
            </button>
          </div>
        )
      )}
    </div>
  );
}
