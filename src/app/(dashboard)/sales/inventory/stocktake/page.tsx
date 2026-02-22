"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";

type InventoryItem = {
  product_id: string;
  product_name: string;
  category: string | null;
  current_stock: number;
};

type StocktakeEntry = {
  product_id: string;
  product_name: string;
  category: string | null;
  system_stock: number;
  actual_stock: string;
};

export default function StocktakePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<StocktakeEntry[]>([]);
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
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

    const { data } = await supabase.rpc("get_inventory_summary", {
      p_salon_id: salon.id,
    });

    const items = (data as InventoryItem[]) ?? [];
    setEntries(
      items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        category: item.category,
        system_stock: item.current_stock,
        actual_stock: item.current_stock.toString(),
      }))
    );
    setLoading(false);
  };

  const updateActualStock = (productId: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.product_id === productId ? { ...e, actual_stock: value } : e
      )
    );
  };

  // 差分がある商品のみ
  const diffs = entries.filter((e) => {
    const actual = parseInt(e.actual_stock, 10);
    return !isNaN(actual) && actual !== e.system_stock;
  });

  const handleSubmit = async () => {
    if (diffs.length === 0) {
      setError("差分がありません");
      return;
    }
    setError("");
    setSuccess("");
    setSaving(true);

    const supabase = createClient();
    const now = new Date();
    const reason = `${now.getFullYear()}年${now.getMonth() + 1}月 棚卸し調整`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const logs = diffs.map((entry) => {
      const actual = parseInt(entry.actual_stock, 10);
      const diff = actual - entry.system_stock;
      return {
        salon_id: salonId,
        product_id: entry.product_id,
        log_type: "adjust" as const,
        quantity: diff, // 正=増加、負=減少
        reason,
        logged_at: today,
      };
    });

    const { error: insertError } = await supabase
      .from("inventory_logs")
      .insert(logs);

    if (insertError) {
      setError("棚卸し調整の登録に失敗しました");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(`${diffs.length}商品の在庫を調整しました`);

    // 再読み込みで最新の在庫を反映
    setLoading(true);
    await loadInventory();
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors text-center";

  return (
    <div className="space-y-4">
      <PageHeader
        title="棚卸し"
        breadcrumbs={[
          { label: "経営", href: "/sales" },
          { label: "在庫管理", href: "/sales/inventory" },
          { label: "棚卸し" },
        ]}
      />

      {/* 初回案内ヒント */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="text-sm text-blue-800">
          <strong>初めての方へ：</strong>
          繰越在庫の設定にもこの画面が使えます。各商品の「実在庫」に手元の在庫数を入力して確定するだけで、初期在庫として登録されます。サロンオープンからの全履歴の入力は不要です。
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      {success && (
        <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-xs underline"
          >
            閉じる
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-surface border border-border rounded-2xl p-4 animate-pulse space-y-3">
          <div className="h-4 bg-border rounded w-24" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-border rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
          <p>アクティブな商品がありません</p>
          <a
            href="/sales/inventory/products"
            className="inline-block mt-2 text-sm text-accent hover:underline font-medium"
          >
            商品を登録する →
          </a>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-1">
            <p className="text-sm text-text-light mb-3">
              各商品の実在庫を入力してください。差分がある場合に調整ログが作成されます。
            </p>

            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px_60px] gap-2 text-xs text-text-light font-medium px-1 pb-2 border-b border-border">
              <span>商品</span>
              <span className="text-center">システム</span>
              <span className="text-center">実在庫</span>
              <span className="text-center">差分</span>
            </div>

            {/* Entries */}
            {entries.map((entry) => {
              const actual = parseInt(entry.actual_stock, 10);
              const diff = isNaN(actual) ? 0 : actual - entry.system_stock;
              const hasDiff = !isNaN(actual) && diff !== 0;

              return (
                <div
                  key={entry.product_id}
                  className={`grid grid-cols-[1fr_80px_80px_60px] gap-2 items-center py-2 px-1 rounded-lg ${
                    hasDiff ? "bg-amber-50" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{entry.product_name}</p>
                    {entry.category && (
                      <p className="text-xs text-text-light truncate">{entry.category}</p>
                    )}
                  </div>
                  <p className="text-sm text-center text-text-light tabular-nums">
                    {entry.system_stock}
                  </p>
                  <input
                    type="number"
                    value={entry.actual_stock}
                    onChange={(e) => updateActualStock(entry.product_id, e.target.value)}
                    min="0"
                    className={`${inputClass} text-sm py-2`}
                  />
                  <p
                    className={`text-sm text-center font-bold tabular-nums ${
                      diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-text-light"
                    }`}
                  >
                    {hasDiff ? (diff > 0 ? `+${diff}` : diff) : "—"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Summary & Submit */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                差分がある商品: <span className="text-accent font-bold">{diffs.length}件</span>
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || diffs.length === 0}
                className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
              >
                {saving ? "処理中..." : "棚卸しを確定"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
