"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { MenuCard } from "@/components/settings/menu-card";
import { StaffMenuSelector } from "@/components/settings/staff-menu-selector";
import { EmptyState } from "@/components/ui/empty-state";
import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];
type StaffMenu = { id: string; staff_id: string; menu_id: string };
type StaffOption = { id: string; name: string };

const CATEGORIES = ["フェイシャル", "ボディ", "脱毛", "その他"];

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [staffMenus, setStaffMenus] = useState<StaffMenu[]>([]);
  const [salonId, setSalonId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({ name: "", category: "", duration_minutes: "", price: "" });
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  useEffect(() => { loadMenus(); }, []);

  const loadMenus = async () => {
    const { user, salonId: sid } = await getClientAuth();
    if (!user || !sid) return;
    setSalonId(sid);

    const supabase = createClient();
    const [menusRes, staffRes, staffMenusRes] = await Promise.all([
      supabase.from("treatment_menus").select("id, name, category, duration_minutes, price, is_active, created_at").eq("salon_id", sid).order("created_at", { ascending: true }).returns<Menu[]>(),
      supabase.from("staff").select("id, name").eq("salon_id", sid).eq("is_active", true).order("name"),
      supabase.from("staff_menus").select("id, staff_id, menu_id").returns<StaffMenu[]>(),
    ]);

    setMenus(menusRes.data ?? []);
    setStaffList(staffRes.data ?? []);
    setStaffMenus(staffMenusRes.data ?? []);
  };

  const resetForm = () => {
    setForm({ name: "", category: "", duration_minutes: "", price: "" });
    setSelectedStaffIds([]);
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
      duration_minutes: form.duration_minutes && !isNaN(parseInt(form.duration_minutes, 10)) ? parseInt(form.duration_minutes, 10) : null,
      price: form.price && !isNaN(parseInt(form.price, 10)) ? parseInt(form.price, 10) : null,
    };

    let menuId = editingId;

    if (editingId) {
      const { error } = await supabase.from("treatment_menus").update(payload).eq("id", editingId).eq("salon_id", salonId);
      if (error) { setError(`メニューの更新に失敗しました: ${error.message}`); setLoading(false); return; }
    } else {
      const { data, error } = await supabase.from("treatment_menus").insert({ ...payload, salon_id: salonId }).select("id").single<{ id: string }>();
      if (error || !data) { setError(`メニューの追加に失敗しました: ${error?.message ?? "不明なエラー"}`); setLoading(false); return; }
      menuId = data.id;
    }

    // スタッフ-メニュー紐づけを更新（2人以上のスタッフがいる場合のみ）
    if (menuId && staffList.length > 1) {
      await supabase.from("staff_menus").delete().eq("menu_id", menuId);
      if (selectedStaffIds.length > 0 && selectedStaffIds.length < staffList.length) {
        const rows = selectedStaffIds.map((staffId) => ({ staff_id: staffId, menu_id: menuId }));
        const { error: smError } = await supabase.from("staff_menus").insert(rows);
        if (smError) console.error("staff_menus insert error:", smError);
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
    // 既存のスタッフ紐づけをセット
    const assignedIds = staffMenus.filter((sm) => sm.menu_id === menu.id).map((sm) => sm.staff_id);
    setSelectedStaffIds(assignedIds);
    setEditingId(menu.id);
    setShowForm(true);
  };

  const handleToggleActive = async (menuId: string, currentActive: boolean) => {
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("treatment_menus").update({ is_active: !currentActive }).eq("id", menuId).eq("salon_id", salonId);
    if (error) { setError(`ステータスの変更に失敗しました: ${error.message}`); return; }
    loadMenus();
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm("このメニューを削除しますか？")) return;
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("treatment_menus").delete().eq("id", menuId).eq("salon_id", salonId);
    if (error) { setError(`メニューの削除に失敗しました: ${error.message}`); return; }
    loadMenus();
  };

  // メニューごとの担当スタッフ名をマップ
  const getStaffNames = (menuId: string): string[] => {
    const assignedIds = staffMenus.filter((sm) => sm.menu_id === menuId).map((sm) => sm.staff_id);
    if (assignedIds.length === 0) return [];
    return assignedIds.map((id) => staffList.find((s) => s.id === id)?.name).filter(Boolean) as string[];
  };

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title="施術メニュー"
        breadcrumbs={[{ label: "設定", href: "/settings" }, { label: "施術メニュー" }]}
      >
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[48px]">
            + メニューを登録
          </button>
        )}
      </PageHeader>

      {error && <ErrorAlert message={error} />}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold">{editingId ? "メニューを編集" : "メニューを追加"}</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">メニュー名 <span className="text-error">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="例: フェイシャルエステ60分" className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">カテゴリ</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors">
              <option value="">選択してください</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">所要時間（分）</label>
              <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} placeholder="60" className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">料金（円）</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="10000" className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" />
            </div>
          </div>

          <StaffMenuSelector staffList={staffList} selectedStaffIds={selectedStaffIds} onChange={setSelectedStaffIds} />

          <div className="flex gap-3">
            <button type="button" onClick={resetForm} className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]">キャンセル</button>
            <button type="submit" disabled={loading} className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]">
              {loading ? "保存中..." : editingId ? "更新する" : "追加する"}
            </button>
          </div>
        </form>
      )}

      {menus.length > 0 ? (
        <div className="space-y-2">
          {menus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} staffNames={getStaffNames(menu.id)} onEdit={startEdit} onToggleActive={handleToggleActive} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        !showForm && (
          <EmptyState
            illustration="clipboard"
            message="メニューが登録されていません"
            action={{ label: "最初のメニューを登録する →", onClick: () => setShowForm(true) }}
          />
        )
      )}
    </div>
  );
}
