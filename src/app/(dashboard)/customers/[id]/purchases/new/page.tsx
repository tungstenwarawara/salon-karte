"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";

export default function NewPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [salonId, setSalonId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      purchase_date: today,
      item_name: "",
      quantity: "1",
      unit_price: "",
      memo: "",
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

      const { data: customer } = await supabase
        .from("customers")
        .select("last_name, first_name")
        .eq("id", customerId)
        .single<{ last_name: string; first_name: string }>();
      if (customer) {
        setCustomerName(`${customer.last_name} ${customer.first_name}`);
      }
    };
    load();
  }, [customerId]);

  const quantityNum = Math.max(1, parseInt(form.quantity, 10) || 0);
  const unitPriceNum = Math.max(0, parseInt(form.unit_price, 10) || 0);
  const totalPrice = quantityNum * unitPriceNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_name.trim()) {
      setError("商品名を入力してください");
      return;
    }
    if (!salonId) {
      setError("サロン情報の読み込み中です。しばらくお待ちください。");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("purchases").insert({
      salon_id: salonId,
      customer_id: customerId,
      purchase_date: form.purchase_date,
      item_name: form.item_name.trim(),
      quantity: quantityNum,
      unit_price: unitPriceNum,
      total_price: totalPrice,
      memo: form.memo || null,
    });

    if (insertError) {
      setError("登録に失敗しました");
      setLoading(false);
      return;
    }

    router.push(`/customers/${customerId}`);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  return (
    <div className="space-y-4">
      <PageHeader title="購入記録を登録" backLabel="戻る" />
      {customerName && (
        <p className="text-text-light">
          顧客: <span className="font-medium text-text">{customerName}</span>
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-2xl p-5 space-y-4"
      >
        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">
            購入日 <span className="text-error">*</span>
          </label>
          <input
            type="date"
            value={form.purchase_date}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, purchase_date: e.target.value }))
            }
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            商品名 <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={form.item_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, item_name: e.target.value }))
            }
            placeholder="例: モイスチャークリーム"
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">数量</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  quantity: e.target.value,
                }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              単価（円）
            </label>
            <input
              type="number"
              min={0}
              value={form.unit_price}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  unit_price: e.target.value,
                }))
              }
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>

        <div className="bg-background rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text-light">合計金額</span>
          <span className="text-lg font-bold text-accent">
            {totalPrice.toLocaleString()}円
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            メモ（任意）
          </label>
          <textarea
            value={form.memo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, memo: e.target.value }))
            }
            placeholder="備考があれば記入"
            rows={2}
            className={`${inputClass} resize-none`}
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
    </div>
  );
}
