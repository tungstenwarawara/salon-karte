"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import type { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

const MARITAL_STATUSES = [
  { value: "", label: "選択してください" },
  { value: "未婚", label: "未婚" },
  { value: "既婚", label: "既婚" },
];

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    last_name: "",
    first_name: "",
    last_name_kana: "",
    first_name_kana: "",
    birth_date: "",
    phone: "",
    email: "",
    address: "",
    marital_status: "",
    has_children: "",
    dm_allowed: "true",
    height_cm: "",
    weight_kg: "",
    allergies: "",
    treatment_goal: "",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single<Customer>();
      if (data) {
        setForm({
          last_name: data.last_name,
          first_name: data.first_name,
          last_name_kana: data.last_name_kana ?? "",
          first_name_kana: data.first_name_kana ?? "",
          birth_date: data.birth_date ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          marital_status: data.marital_status ?? "",
          has_children: data.has_children === null ? "" : data.has_children ? "true" : "false",
          dm_allowed: data.dm_allowed === false ? "false" : "true",
          height_cm: data.height_cm !== null ? String(data.height_cm) : "",
          weight_kg: data.weight_kg !== null ? String(data.weight_kg) : "",
          allergies: data.allergies ?? "",
          treatment_goal: data.treatment_goal ?? "",
          notes: data.notes ?? "",
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
    const { error } = await supabase
      .from("customers")
      .update({
        last_name: form.last_name,
        first_name: form.first_name,
        last_name_kana: form.last_name_kana || null,
        first_name_kana: form.first_name_kana || null,
        birth_date: form.birth_date || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        marital_status: form.marital_status || null,
        has_children: form.has_children === "" ? null : form.has_children === "true",
        dm_allowed: form.dm_allowed === "true",
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        allergies: form.allergies || null,
        treatment_goal: form.treatment_goal || null,
        notes: form.notes || null,
      })
      .eq("id", id);

    if (error) {
      setError("更新に失敗しました");
      setLoading(false);
      return;
    }

    router.push(`/customers/${id}`);
  };

  const handleDelete = async () => {
    if (!confirm("この顧客情報を削除しますか？施術記録も全て削除されます。")) {
      return;
    }
    setDeleting(true);

    const supabase = createClient();

    // Clean up storage files for all treatment photos of this customer
    const { data: records } = await supabase
      .from("treatment_records")
      .select("id")
      .eq("customer_id", id);

    if (records && records.length > 0) {
      const recordIds = records.map((r) => r.id);
      const { data: photos } = await supabase
        .from("treatment_photos")
        .select("storage_path")
        .in("treatment_record_id", recordIds);

      if (photos && photos.length > 0) {
        const paths = photos.map((p) => p.storage_path);
        await supabase.storage.from("treatment-photos").remove(paths);
      }
    }

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      setError("削除に失敗しました");
      setDeleting(false);
      return;
    }

    router.push("/customers");
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  return (
    <div className="space-y-4">
      <PageHeader title="顧客情報を編集" backHref="/customers" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* 基本情報 */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-text-light">基本情報</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                姓 <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                名 <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">セイ</label>
              <input
                type="text"
                value={form.last_name_kana}
                onChange={(e) => updateField("last_name_kana", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">メイ</label>
              <input
                type="text"
                value={form.first_name_kana}
                onChange={(e) => updateField("first_name_kana", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">生年月日</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => updateField("birth_date", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">電話番号</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              メールアドレス
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">住所</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* 属性情報 */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-text-light">属性情報</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">婚姻状況</label>
              <select
                value={form.marital_status}
                onChange={(e) => updateField("marital_status", e.target.value)}
                className={inputClass}
              >
                {MARITAL_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">お子様</label>
              <select
                value={form.has_children}
                onChange={(e) => updateField("has_children", e.target.value)}
                className={inputClass}
              >
                <option value="">選択してください</option>
                <option value="true">あり</option>
                <option value="false">なし</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">DM送付</label>
            <select
              value={form.dm_allowed}
              onChange={(e) => updateField("dm_allowed", e.target.value)}
              className={inputClass}
            >
              <option value="true">可</option>
              <option value="false">不可</option>
            </select>
          </div>
        </div>

        {/* 施術関連情報 */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-text-light">施術関連情報</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">身長 (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.height_cm}
                onChange={(e) => updateField("height_cm", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">体重 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.weight_kg}
                onChange={(e) => updateField("weight_kg", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              アレルギー・注意事項
            </label>
            <textarea
              value={form.allergies}
              onChange={(e) => updateField("allergies", e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">施術の最終目標</label>
            <textarea
              value={form.treatment_goal}
              onChange={(e) => updateField("treatment_goal", e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">メモ</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
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
          顧客情報と関連する全ての施術記録が削除されます。この操作は取り消せません。
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-error/10 text-error text-sm font-medium rounded-xl px-4 py-2 hover:bg-error/20 transition-colors disabled:opacity-50 min-h-[40px]"
        >
          {deleting ? "削除中..." : "この顧客を削除"}
        </button>
      </div>
    </div>
  );
}
