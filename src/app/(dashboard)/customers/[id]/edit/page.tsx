"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

const SKIN_TYPES = [
  { value: "", label: "選択してください" },
  { value: "普通肌", label: "普通肌" },
  { value: "乾燥肌", label: "乾燥肌" },
  { value: "脂性肌", label: "脂性肌" },
  { value: "混合肌", label: "混合肌" },
  { value: "敏感肌", label: "敏感肌" },
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
    skin_type: "",
    allergies: "",
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
          skin_type: data.skin_type ?? "",
          allergies: data.allergies ?? "",
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
        skin_type: form.skin_type || null,
        allergies: form.allergies || null,
        notes: form.notes || null,
      })
      .eq("id", id);

    if (error) {
      setError("更新に失敗しました");
      setLoading(false);
      return;
    }

    router.push(`/customers/${id}`);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("この顧客情報を削除しますか？施術記録も全て削除されます。")) {
      return;
    }
    setDeleting(true);

    const supabase = createClient();
    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      setError("削除に失敗しました");
      setDeleting(false);
      return;
    }

    router.push("/customers");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">顧客情報を編集</h2>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}

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
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
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
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
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
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">メイ</label>
            <input
              type="text"
              value={form.first_name_kana}
              onChange={(e) => updateField("first_name_kana", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">生年月日</label>
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => updateField("birth_date", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">電話番号</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
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
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">肌質</label>
          <select
            value={form.skin_type}
            onChange={(e) => updateField("skin_type", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          >
            {SKIN_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            アレルギー・注意事項
          </label>
          <textarea
            value={form.allergies}
            onChange={(e) => updateField("allergies", e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">メモ</label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
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
