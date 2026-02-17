"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhotos } from "@/lib/supabase/storage";
import { PhotoUpload, type PhotoEntry } from "@/components/records/photo-upload";
import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];

export default function NewRecordPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-light py-8">読み込み中...</div>}>
      <NewRecordForm />
    </Suspense>
  );
}

function NewRecordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer");

  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [salonId, setSalonId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  const [form, setForm] = useState({
    treatment_date: new Date().toISOString().split("T")[0],
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
      setSalonId(salon.id);

      const { data: menuData } = await supabase
        .from("treatment_menus")
        .select("*")
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("name")
        .returns<Menu[]>();
      setMenus(menuData ?? []);

      if (customerId) {
        const { data: customer } = await supabase
          .from("customers")
          .select("last_name, first_name")
          .eq("id", customerId)
          .single<{ last_name: string; first_name: string }>();
        if (customer) {
          setCustomerName(`${customer.last_name} ${customer.first_name}`);
        }
      }
    };
    load();
  }, [customerId]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError("顧客が選択されていません");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const selectedMenu = menus.find((m) => m.id === form.menu_id);

    const { data: record, error: insertError } = await supabase
      .from("treatment_records")
      .insert({
        customer_id: customerId,
        salon_id: salonId,
        treatment_date: form.treatment_date,
        menu_id: form.menu_id || null,
        menu_name_snapshot: selectedMenu?.name ?? null,
        treatment_area: form.treatment_area || null,
        products_used: form.products_used || null,
        skin_condition_before: form.skin_condition_before || null,
        notes_after: form.notes_after || null,
        next_visit_memo: form.next_visit_memo || null,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !record) {
      setError("登録に失敗しました");
      setLoading(false);
      return;
    }

    if (photos.length > 0) {
      const { errors: photoErrors } = await uploadPhotos(
        record.id,
        salonId,
        photos
      );
      if (photoErrors.length > 0) {
        setError(
          "施術記録は保存されましたが、一部の写真のアップロードに失敗しました"
        );
      }
    }

    router.push(`/customers/${customerId}`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">施術記録を作成</h2>
      {customerName && (
        <p className="text-text-light">
          顧客: <span className="font-medium text-text">{customerName}</span>
        </p>
      )}

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
                {menu.duration_minutes ? ` (${menu.duration_minutes}分)` : ""}
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
            placeholder="例: 顔全体、デコルテ"
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
            placeholder="使用した化粧品や機器を記録"
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
            placeholder="施術前の肌の状態を記録"
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
            placeholder="施術後の状態や経過を記録"
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
            placeholder="次回施術時の注意点やプランなど"
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* Photo upload */}
        <PhotoUpload photos={photos} onChange={setPhotos} />

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
