"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { PurchaseCard } from "./purchase-card";
import { Toast, useToast } from "@/components/ui/toast";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

type EditData = {
  item_name: string;
  unit_price: number;
  quantity: number;
  memo: string;
};

type Props = {
  customerId: string;
  purchases: Purchase[];
  purchaseTotal: number;
  salonId: string;
};

const INITIAL_SHOW = 5;

export function PurchaseHistory({ customerId, purchases: initialPurchases, salonId }: Props) {
  const [purchases, setPurchases] = useState(initialPurchases);
  const [showAll, setShowAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const total = purchases.reduce((sum, p) => sum + p.total_price, 0);
  const displayPurchases = showAll ? purchases : purchases.slice(0, INITIAL_SHOW);
  const hasMore = purchases.length > INITIAL_SHOW;

  const handleDelete = async (id: string) => {
    const purchase = purchases.find((p) => p.id === id);
    if (!purchase) return;
    setProcessingId(id);
    setConfirmDeleteId(null);

    const supabase = createClient();
    let ok = false;

    if (purchase.product_id) {
      const { error } = await supabase.rpc("reverse_product_sale", { p_purchase_id: id });
      ok = !error;
    } else {
      const { error } = await supabase.from("purchases").delete().eq("id", id).eq("salon_id", salonId);
      ok = !error;
    }

    setProcessingId(null);
    if (ok) {
      setPurchases((prev) => prev.filter((p) => p.id !== id));
      showToast("購入記録を削除しました");
    } else {
      showToast("削除に失敗しました", "error");
    }
  };

  const handleSaveEdit = async (id: string, data: EditData) => {
    setProcessingId(id);
    const supabase = createClient();
    const total_price = data.unit_price * data.quantity;

    const { error } = await supabase
      .from("purchases")
      .update({
        item_name: data.item_name,
        unit_price: data.unit_price,
        quantity: data.quantity,
        total_price,
        memo: data.memo || null,
      })
      .eq("id", id)
      .eq("salon_id", salonId);

    setProcessingId(null);
    if (!error) {
      setPurchases((prev) => prev.map((p) => p.id === id ? { ...p, ...data, total_price, memo: data.memo || null } : p));
      setEditingId(null);
      showToast("購入記録を更新しました");
    } else {
      showToast("更新に失敗しました", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">
          物販購入履歴
          {total > 0 && (
            <span className="text-sm font-normal text-text-light ml-2">
              合計 {total.toLocaleString()}円
            </span>
          )}
        </h3>
        <Link href={`/customers/${customerId}/purchases/new`}
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[40px] flex items-center">
          + 購入記録
        </Link>
      </div>

      {purchases.length > 0 ? (
        <div className="space-y-2">
          {displayPurchases.map((p) => (
            <PurchaseCard key={p.id} purchase={p}
              confirmDeleteId={confirmDeleteId} editingId={editingId} processingId={processingId}
              onRequestDelete={setConfirmDeleteId}
              onConfirmDelete={handleDelete}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onStartEdit={setEditingId}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={handleSaveEdit} />
          ))}
          {hasMore && (
            <button onClick={() => setShowAll(!showAll)}
              className="w-full text-center text-sm text-accent py-2 min-h-[44px]">
              {showAll ? "閉じる" : `もっと見る（残り${purchases.length - INITIAL_SHOW}件）`}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-light text-sm">購入記録はまだありません</p>
          <Link href={`/customers/${customerId}/purchases/new`}
            className="inline-block mt-2 text-sm text-accent hover:underline font-medium">
            最初の購入を記録する →
          </Link>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
