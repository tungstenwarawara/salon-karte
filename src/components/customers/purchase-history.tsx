"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useIncrementalList } from "@/hooks/use-incremental-list";
import type { Database } from "@/types/database";
import { PurchaseCard } from "./purchase-card";
import { Toast, useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

type EditData = {
  item_name: string;
  unit_price: number;
  quantity: number;
  memo: string;
  payment_type: "cash" | "credit";
};

type Props = {
  customerId: string;
  purchases: Purchase[];
  purchaseTotal: number;
  salonId: string;
};

export function PurchaseHistory({ customerId, purchases: initialPurchases, salonId }: Props) {
  const router = useRouter();
  const [purchases, setPurchases] = useState(initialPurchases);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const total = purchases.reduce((sum, p) => sum + p.total_price, 0);
  const { displayItems, hasMore, remaining, showMore, collapse, isExpanded } =
    useIncrementalList(purchases, 10, 5);

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
      router.refresh();
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
        payment_type: data.payment_type,
      })
      .eq("id", id)
      .eq("salon_id", salonId);

    setProcessingId(null);
    if (!error) {
      setPurchases((prev) => prev.map((p) => p.id === id ? { ...p, ...data, total_price, memo: data.memo || null, payment_type: data.payment_type } : p));
      setEditingId(null);
      showToast("購入記録を更新しました");
      router.refresh();
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
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center">
          + 物販を登録
        </Link>
      </div>
      <p className="text-xs text-text-light mb-3">
        施術と同時に記録する場合は、カルテ作成画面の「物販記録」から追加できます。
      </p>

      {purchases.length > 0 ? (
        <div>
          <div className="space-y-2">
            {displayItems.map((p) => (
              <PurchaseCard key={p.id} purchase={p}
                confirmDeleteId={confirmDeleteId} editingId={editingId} processingId={processingId}
                onRequestDelete={setConfirmDeleteId}
                onConfirmDelete={handleDelete}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onStartEdit={setEditingId}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={handleSaveEdit} />
            ))}
          </div>
          {hasMore && (
            <button onClick={showMore}
              className="w-full text-center text-sm text-accent py-2 min-h-[44px] mt-2">
              もっと見る（残り{remaining}件）
            </button>
          )}
          {isExpanded && (
            <button onClick={collapse}
              className="w-full text-center text-sm text-text-light py-2 min-h-[44px]">
              閉じる
            </button>
          )}
        </div>
      ) : (
        <EmptyState
          illustration="product"
          message="購入記録はまだありません"
          action={{ label: "最初の物販を登録する →", href: `/customers/${customerId}/purchases/new` }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
