"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { MenuCard } from "@/components/settings/menu-card";
import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];

const CATEGORIES = ["フェイシャル", "ボディ", "脱毛", "その他"];

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [salonId, setSalonId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();
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
      .select("id, name, category, duration_minutes, price, is_active, created_at")
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
    setError("");
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
      const { error } = await supabase
        .from("treatment_menus")
        .update(payload)
        .eq("id", editingId)
        .eq("salon_id", salonId);
      if (error) {
        setError("メニューの更新に失敗しました");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("treatment_menus")
        .insert({ ...payload, salon_id: salonId });
      if (error) {
        setError("メニューの追加に失敗しました");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    resetForm();
    showToast(editingId ? "メニューを更新しました" : "メニューを追加しました");
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

  const handleToggleActive = async (menuId: string, currentActive: boolean) => {
    setError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("treatment_menus")
      .update({ is_active: !currentActive })
      .eq("id", menuId)
      .eq("salon_id", salonId);
    if (error) {
      setError("ステータスの変更に失敗しました");
      return;
    }
    loadMenus();
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm("このメニューを削除しますか？")) return;
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("treatment_menus").delete().eq("id", menuId).eq("salon_id", salonId);
    if (error) {
      setError("メニューの削除に失敗しました");
      return;
    }
    loadMenus();
  };

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title="施術メニュー"
        backLabel="設定"
        backHref="/settings"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "施術メニュー" },
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

      {/* メニュー一覧 */}
      {menus.length > 0 ? (
        <div className="space-y-2">
          {menus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              onEdit={startEdit}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-text-light">メニューが登録されていません</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block mt-2 text-sm text-accent hover:underline font-medium"
            >
              最初のメニューを追加する →
            </button>
          </div>
        )
      )}
    </div>
  );
}
