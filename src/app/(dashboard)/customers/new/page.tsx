"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";

const MARITAL_STATUSES = [
  { value: "", label: "選択してください" },
  { value: "未婚", label: "未婚" },
  { value: "既婚", label: "既婚" },
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
      address: form.address || null,
      marital_status: form.marital_status || null,
      has_children: form.has_children === "" ? null : form.has_children === "true",
      dm_allowed: form.dm_allowed === "true",
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      allergies: form.allergies || null,
      treatment_goal: form.treatment_goal || null,
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

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  return (
    <div className="space-y-4">
      <PageHeader title="顧客を追加" backLabel="顧客一覧" backHref="/customers" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* 基本情報 */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-text-light">基本情報</h3>

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
                placeholder="花子"
                className={inputClass}
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
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">メイ</label>
              <input
                type="text"
                value={form.first_name_kana}
                onChange={(e) => updateField("first_name_kana", e.target.value)}
                placeholder="ハナコ"
                className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
            />
          </div>

          {/* 住所 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">住所</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="東京都渋谷区..."
              className={inputClass}
            />
          </div>
        </div>

        {/* 詳細情報（折りたたみ） */}
        <details className="bg-surface border border-border rounded-2xl">
          <summary className="p-5 cursor-pointer font-bold text-sm text-text-light flex items-center justify-between list-none">
            <span>詳細情報を追加（任意）</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 transition-transform details-open-rotate">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
            {/* 属性情報 */}
            <h4 className="font-medium text-xs text-text-light uppercase tracking-wide">属性情報</h4>
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

            {/* 施術関連情報 */}
            <h4 className="font-medium text-xs text-text-light uppercase tracking-wide pt-2">施術関連情報</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">身長 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.height_cm}
                  onChange={(e) => updateField("height_cm", e.target.value)}
                  placeholder="160"
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
                  placeholder="55"
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
                placeholder="アレルギーや施術時の注意事項"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">施術の最終目標</label>
              <textarea
                value={form.treatment_goal}
                onChange={(e) => updateField("treatment_goal", e.target.value)}
                placeholder="お客様の施術に対する最終目標"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">メモ</label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="自由メモ"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </details>

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
