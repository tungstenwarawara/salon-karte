"use client";

import { useState } from "react";
import type { Database } from "@/types/database";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

type EditData = {
  item_name: string;
  unit_price: number;
  quantity: number;
  memo: string;
};

type Props = {
  purchase: Purchase;
  confirmDeleteId: string | null;
  editingId: string | null;
  processingId: string | null;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string, data: EditData) => void;
};

export function PurchaseCard({
  purchase, confirmDeleteId, editingId, processingId,
  onRequestDelete, onConfirmDelete, onCancelDelete,
  onStartEdit, onCancelEdit, onSaveEdit,
}: Props) {
  const isEditing = editingId === purchase.id;
  const isProductLinked = !!purchase.product_id;

  const [editForm, setEditForm] = useState<EditData>({
    item_name: purchase.item_name,
    unit_price: purchase.unit_price,
    quantity: purchase.quantity,
    memo: purchase.memo ?? "",
  });

  const handleStartEdit = () => {
    setEditForm({
      item_name: purchase.item_name,
      unit_price: purchase.unit_price,
      quantity: purchase.quantity,
      memo: purchase.memo ?? "",
    });
    onStartEdit(purchase.id);
  };

  return (
    <div className="border border-border rounded-xl p-3 space-y-2">
      {/* 通常表示 */}
      {!isEditing && (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{purchase.item_name}</p>
              <p className="text-xs text-text-light">
                {purchase.purchase_date} ・ {purchase.unit_price.toLocaleString()}円 × {purchase.quantity}個
              </p>
            </div>
            <p className="text-sm font-bold shrink-0">{purchase.total_price.toLocaleString()}円</p>
          </div>
          {purchase.memo && <p className="text-xs text-text-light">{purchase.memo}</p>}
          <div className="flex items-center justify-end gap-1.5">
            <button onClick={handleStartEdit} disabled={processingId !== null}
              className="text-xs text-accent px-2 py-1.5 rounded-lg hover:bg-accent/5 transition-colors min-h-[44px] disabled:opacity-50">
              編集
            </button>
            <button onClick={() => onRequestDelete(purchase.id)} disabled={processingId !== null}
              className="text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 transition-colors min-h-[44px] disabled:opacity-50">
              {processingId === purchase.id ? "削除中..." : "削除"}
            </button>
          </div>
        </>
      )}

      {/* 編集モード */}
      {isEditing && (
        <div className="bg-background rounded-xl p-3 space-y-3">
          {isProductLinked ? (
            <>
              <p className="text-xs text-text-light">商品連動の購入記録のため、メモのみ編集できます</p>
              <div>
                <label className="text-xs text-text-light">メモ</label>
                <input type="text" value={editForm.memo}
                  onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface mt-1" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-text-light">商品名</label>
                <input type="text" value={editForm.item_name}
                  onChange={(e) => setEditForm({ ...editForm, item_name: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface mt-1" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-text-light">単価</label>
                  <input type="number" value={editForm.unit_price} min={0}
                    onChange={(e) => setEditForm({ ...editForm, unit_price: parseInt(e.target.value) || 0 })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface mt-1" />
                </div>
                <div className="w-20">
                  <label className="text-xs text-text-light">数量</label>
                  <input type="number" value={editForm.quantity} min={1}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface mt-1" />
                </div>
              </div>
              <p className="text-xs text-right text-accent font-medium">
                合計: {(editForm.unit_price * editForm.quantity).toLocaleString()}円
              </p>
              <div>
                <label className="text-xs text-text-light">メモ</label>
                <input type="text" value={editForm.memo}
                  onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface mt-1" />
              </div>
            </>
          )}
          <div className="flex gap-2">
            <button onClick={onCancelEdit}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-surface transition-colors min-h-[44px]">
              キャンセル
            </button>
            <button onClick={() => onSaveEdit(purchase.id, editForm)} disabled={processingId !== null}
              className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg hover:bg-accent-light transition-colors min-h-[44px] disabled:opacity-50">
              {processingId === purchase.id ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      {/* 削除確認パネル */}
      {confirmDeleteId === purchase.id && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
          <p className="text-sm font-medium text-red-800">この購入記録を削除しますか？</p>
          <ul className="text-xs text-red-700 space-y-0.5">
            <li>この操作は取り消せません</li>
            {isProductLinked && <li>在庫が{purchase.quantity}個戻ります</li>}
          </ul>
          <div className="flex gap-2">
            <button onClick={onCancelDelete} className="flex-1 text-xs px-3 py-2 rounded-lg border border-border hover:bg-surface transition-colors min-h-[44px]">キャンセル</button>
            <button onClick={() => onConfirmDelete(purchase.id)} className="flex-1 text-xs bg-error text-white px-3 py-2 rounded-lg hover:opacity-90 transition-colors min-h-[44px] font-medium">削除する</button>
          </div>
        </div>
      )}
    </div>
  );
}
