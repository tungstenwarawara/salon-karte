"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];

const CATEGORIES = ["フェイシャル", "ボディ", "脱毛", "その他"];

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [salonId, setSalonId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    duration_minutes: "",
    price: "",
  });

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
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
      .from("treatment_menus")
      .select("*")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: true })
      .returns<Menu[]>();

    setMenus(data ?? []);
  };

  const resetForm = () => {
    setForm({ name: "", category: "", duration_minutes: "", price: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const payload = {
      name: form.name,
      category: form.category || null,
      duration_minutes: form.duration_minutes
        ? parseInt(form.duration_minutes)
        : null,
      price: form.price ? parseInt(form.price) : null,
    };

    if (editingId) {
      await supabase
        .from("treatment_menus")
        .update(payload)
        .eq("id", editingId);
    } else {
      await supabase
        .from("treatment_menus")
        .insert({ ...payload, salon_id: salonId });
    }

    setLoading(false);
    resetForm();
    loadMenus();
  };

  const startEdit = (menu: Menu) => {
    setForm({
      name: menu.name,
      category: menu.category ?? "",
      duration_minutes: menu.duration_minutes?.toString() ?? "",
      price: menu.price?.toString() ?? "",
    });
    setEditingId(menu.id);
    setShowForm(true);
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm("このメニューを削除しますか？")) return;
    const supabase = createClient();
    await supabase.from("treatment_menus").delete().eq("id", menuId);
    loadMenus();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">施術メニュー</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[40px]"
          >
            + 追加
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold">
            {editingId ? "メニューを編集" : "メニューを追加"}
          </h3>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              メニュー名 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="例: フェイシャルエステ60分"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              カテゴリ
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            >
              <option value="">選択してください</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                所要時間（分）
              </label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: e.target.value })
                }
                placeholder="60"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                料金（円）
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="10000"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              />
            </div>
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

      {/* List */}
      {menus.length > 0 ? (
        <div className="space-y-2">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{menu.name}</p>
                  <div className="flex gap-3 mt-1 text-sm text-text-light">
                    {menu.category && <span>{menu.category}</span>}
                    {menu.duration_minutes && (
                      <span>{menu.duration_minutes}分</span>
                    )}
                    {menu.price && (
                      <span>{menu.price.toLocaleString()}円</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(menu)}
                    className="text-sm text-accent hover:underline"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id)}
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
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
            メニューが登録されていません
          </div>
        )
      )}
    </div>
  );
}
