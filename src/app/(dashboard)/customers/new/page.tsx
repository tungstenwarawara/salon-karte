"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SKIN_TYPES = [
  { value: "", label: "選択してください" },
  { value: "普通肌", label: "普通肌" },
  { value: "乾燥肌", label: "乾燥肌" },
  { value: "脂性肌", label: "脂性肌" },
  { value: "混合肌", label: "混合肌" },
  { value: "敏感肌", label: "敏感肌" },
];

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("ログインセッションが切れました");
      setLoading(false);
      return;
    }

    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single<{ id: string }>();
    if (!salon) {
      setError("サロン情報が見つかりません");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("customers").insert({
      salon_id: salon.id,
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
    });

    if (error) {
      setError("登録に失敗しました。もう一度お試しください");
      setLoading(false);
      return;
    }

    router.push("/customers");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">顧客を追加</h2>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* 氏名 */}
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
              placeholder="山田"
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
              placeholder="花子"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* カナ */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">セイ</label>
            <input
              type="text"
              value={form.last_name_kana}
              onChange={(e) => updateField("last_name_kana", e.target.value)}
              placeholder="ヤマダ"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">メイ</label>
            <input
              type="text"
              value={form.first_name_kana}
              onChange={(e) => updateField("first_name_kana", e.target.value)}
              placeholder="ハナコ"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* 生年月日 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">生年月日</label>
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => updateField("birth_date", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        {/* 電話番号 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">電話番号</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="090-1234-5678"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        {/* メール */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            メールアドレス
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="example@email.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        {/* 肌質 */}
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

        {/* アレルギー */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            アレルギー・注意事項
          </label>
          <textarea
            value={form.allergies}
            onChange={(e) => updateField("allergies", e.target.value)}
            placeholder="アレルギーや施術時の注意事項"
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* メモ */}
        <div>
          <label className="block text-sm font-medium mb-1.5">メモ</label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="自由メモ"
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* Submit */}
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
            {loading ? "登録中..." : "登録する"}
          </button>
        </div>
      </form>
    </div>
  );
}
