"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  salonId: string;
  onCreated: (customer: { id: string; last_name: string; first_name: string; last_name_kana: string | null; first_name_kana: string | null }) => void;
  onCancel: () => void;
};

export function InlineCustomerCreate({ salonId, onCreated, onCancel }: Props) {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!lastName.trim() || !firstName.trim()) {
      setError("姓と名は必須です");
      return;
    }
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("customers")
      .insert({
        salon_id: salonId,
        last_name: lastName.trim(),
        first_name: firstName.trim(),
        phone: phone.trim() || null,
      })
      .select("id, last_name, first_name, last_name_kana, first_name_kana")
      .single();

    if (insertError || !data) {
      setError(`登録に失敗しました: ${insertError?.message ?? "不明なエラー"}`);
      setSaving(false);
      return;
    }

    onCreated(data);
  };

  const inputClass = "w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]";

  return (
    <div className="bg-background rounded-xl p-3 space-y-3 border-t border-border mt-2">
      <p className="text-sm font-medium">新規顧客を登録</p>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="姓 *" className={inputClass} />
        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="名 *" className={inputClass} />
      </div>
      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="電話番号（任意）" className={inputClass} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-border rounded-lg py-2 text-sm min-h-[44px]">
          キャンセル
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className="flex-1 bg-accent text-white rounded-lg py-2 text-sm font-medium min-h-[44px] disabled:opacity-50">
          {saving ? "登録中..." : "登録して選択"}
        </button>
      </div>
    </div>
  );
}
