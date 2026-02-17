"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];
type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];

export default function EditRecordPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");

  const [form, setForm] = useState({
    treatment_date: "",
    menu_id: "",
    treatment_area: "",
    products_used: "",
    skin_condition_before: "",
    notes_after: "",
    next_visit_memo: "",
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

      // Load menus
      const { data: menuData } = await supabase
        .from("treatment_menus")
        .select("*")
        .eq("salon_id", salon.id)
        .order("name")
        .returns<Menu[]>();
      setMenus(menuData ?? []);

      // Load record
      const { data: record } = await supabase
        .from("treatment_records")
        .select("*")
        .eq("id", id)
        .single<TreatmentRecord>();

      if (record) {
        setCustomerId(record.customer_id);
        setForm({
          treatment_date: record.treatment_date,
          menu_id: record.menu_id ?? "",
          treatment_area: record.treatment_area ?? "",
          products_used: record.products_used ?? "",
          skin_condition_before: record.skin_condition_before ?? "",
          notes_after: record.notes_after ?? "",
          next_visit_memo: record.next_visit_memo ?? "",
        });
      }
    };
    load();
  }, [id]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const selectedMenu = menus.find((m) => m.id === form.menu_id);

    const { error } = await supabase
      .from("treatment_records")
      .update({
        treatment_date: form.treatment_date,
        menu_id: form.menu_id || null,
        menu_name_snapshot: selectedMenu?.name ?? null,
        treatment_area: form.treatment_area || null,
        products_used: form.products_used || null,
        skin_condition_before: form.skin_condition_before || null,
        notes_after: form.notes_after || null,
        next_visit_memo: form.next_visit_memo || null,
      })
      .eq("id", id);

    if (error) {
      setError("更新に失敗しました");
      setLoading(false);
      return;
    }

    router.push(`/records/${id}`);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("この施術記録を削除しますか？")) return;
    setDeleting(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("treatment_records")
      .delete()
      .eq("id", id);

    if (error) {
      setError("削除に失敗しました");
      setDeleting(false);
      return;
    }

    router.push(customerId ? `/customers/${customerId}` : "/dashboard");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">施術記録を編集</h2>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">
            施術日 <span className="text-error">*</span>
          </label>
          <input
            type="date"
            value={form.treatment_date}
            onChange={(e) => updateField("treatment_date", e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            施術メニュー
          </label>
          <select
            value={form.menu_id}
            onChange={(e) => updateField("menu_id", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          >
            <option value="">選択してください</option>
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">施術部位</label>
          <input
            type="text"
            value={form.treatment_area}
            onChange={(e) => updateField("treatment_area", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            使用した化粧品・機器
          </label>
          <textarea
            value={form.products_used}
            onChange={(e) => updateField("products_used", e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            施術前の肌の状態
          </label>
          <textarea
            value={form.skin_condition_before}
            onChange={(e) =>
              updateField("skin_condition_before", e.target.value)
            }
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            施術後の経過メモ
          </label>
          <textarea
            value={form.notes_after}
            onChange={(e) => updateField("notes_after", e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            次回への申し送り
          </label>
          <textarea
            value={form.next_visit_memo}
            onChange={(e) => updateField("next_visit_memo", e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
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

      {/* Delete */}
      <div className="bg-surface border border-error/20 rounded-2xl p-5">
        <h3 className="font-bold text-sm text-error mb-2">危険な操作</h3>
        <p className="text-sm text-text-light mb-3">
          この施術記録を削除します。この操作は取り消せません。
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-error/10 text-error text-sm font-medium rounded-xl px-4 py-2 hover:bg-error/20 transition-colors disabled:opacity-50 min-h-[40px]"
        >
          {deleting ? "削除中..." : "この記録を削除"}
        </button>
      </div>
    </div>
  );
}
