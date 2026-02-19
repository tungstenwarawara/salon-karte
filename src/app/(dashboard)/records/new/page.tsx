"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhotos } from "@/lib/supabase/storage";
import { PhotoUpload, type PhotoEntry } from "@/components/records/photo-upload";
import { PageHeader } from "@/components/layout/page-header";
import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];
type CustomerOption = { id: string; last_name: string; first_name: string; last_name_kana: string | null; first_name_kana: string | null };

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
  const presetCustomerId = searchParams.get("customer");
  const appointmentId = searchParams.get("appointment");

  const [menus, setMenus] = useState<Menu[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(presetCustomerId ?? "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [salonId, setSalonId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  // Derived: the active customer ID (from URL or user selection)
  const customerId = presetCustomerId ?? selectedCustomerId;

  const [form, setForm] = useState(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
    treatment_date: today,
    menu_id: "",
    treatment_area: "",
    products_used: "",
    skin_condition_before: "",
    notes_after: "",
    next_visit_memo: "",
    conversation_notes: "",
    caution_notes: "",
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

      const { data: menuData } = await supabase
        .from("treatment_menus")
        .select("*")
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("name")
        .returns<Menu[]>();
      setMenus(menuData ?? []);

      // Load all customers for selector (when no preset customer)
      if (!presetCustomerId) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("id, last_name, first_name, last_name_kana, first_name_kana")
          .eq("salon_id", salon.id)
          .order("last_name_kana", { ascending: true })
          .returns<CustomerOption[]>();
        setCustomers(customerData ?? []);
      }

      if (presetCustomerId) {
        const { data: customer } = await supabase
          .from("customers")
          .select("last_name, first_name")
          .eq("id", presetCustomerId)
          .single<{ last_name: string; first_name: string }>();
        if (customer) {
          setCustomerName(`${customer.last_name} ${customer.first_name}`);
        }
      }
    };
    load();
  }, [presetCustomerId]);

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
        conversation_notes: form.conversation_notes || null,
        caution_notes: form.caution_notes || null,
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

    // Link appointment to treatment record if created from appointment
    if (appointmentId) {
      await supabase
        .from("appointments")
        .update({ treatment_record_id: record.id, status: "completed" })
        .eq("id", appointmentId);
    }

    router.push(`/customers/${customerId}`);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  // Filter customers for search
  const filteredCustomers = customerSearch
    ? customers.filter((c) => {
        const fullName = `${c.last_name}${c.first_name}`;
        const fullKana = `${c.last_name_kana ?? ""}${c.first_name_kana ?? ""}`;
        const q = customerSearch.toLowerCase();
        return fullName.includes(q) || fullKana.includes(q);
      })
    : customers;

  return (
    <div className="space-y-4">
      <PageHeader title="施術記録を作成" backLabel="戻る" />

      {/* Customer display (when preset from URL) */}
      {presetCustomerId && customerName && (
        <p className="text-text-light">
          顧客: <span className="font-medium text-text">{customerName}</span>
        </p>
      )}

      {/* Customer selector (when NOT preset) */}
      {!presetCustomerId && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <label className="block text-sm font-bold">
            顧客を選択 <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="名前・カナで検索..."
            className={inputClass}
          />
          {customers.length === 0 ? (
            <p className="text-sm text-text-light text-center py-2">
              顧客が登録されていません
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(c.id);
                    setCustomerName(`${c.last_name} ${c.first_name}`);
                    setCustomerSearch("");
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    selectedCustomerId === c.id
                      ? "bg-accent/10 border border-accent text-accent font-medium"
                      : "hover:bg-background border border-transparent"
                  }`}
                >
                  <span>{c.last_name} {c.first_name}</span>
                  {c.last_name_kana && (
                    <span className="text-xs text-text-light ml-2">
                      {c.last_name_kana} {c.first_name_kana}
                    </span>
                  )}
                </button>
              ))}
              {filteredCustomers.length === 0 && customerSearch && (
                <p className="text-sm text-text-light text-center py-2">
                  該当する顧客がいません
                </p>
              )}
            </div>
          )}
          {selectedCustomerId && customerName && (
            <div className="flex items-center gap-2 bg-accent/5 rounded-xl px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-accent shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span className="text-sm font-medium">{customerName}</span>
            </div>
          )}
        </div>
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
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            施術メニュー
          </label>
          <select
            value={form.menu_id}
            onChange={(e) => updateField("menu_id", e.target.value)}
            className={inputClass}
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
            className={inputClass}
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
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            施術前の状態
          </label>
          <textarea
            value={form.skin_condition_before}
            onChange={(e) =>
              updateField("skin_condition_before", e.target.value)
            }
            placeholder="施術前の状態を記録"
            rows={2}
            className={`${inputClass} resize-none`}
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
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            話した内容（会話メモ）
          </label>
          <textarea
            value={form.conversation_notes}
            onChange={(e) => updateField("conversation_notes", e.target.value)}
            placeholder="お客様との会話で覚えておきたいこと"
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            注意事項
          </label>
          <textarea
            value={form.caution_notes}
            onChange={(e) => updateField("caution_notes", e.target.value)}
            placeholder="次回以降に注意すべきこと"
            rows={2}
            className={`${inputClass} resize-none`}
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
            className={`${inputClass} resize-none`}
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
