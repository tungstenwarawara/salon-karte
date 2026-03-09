"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { CourseTicket } from "@/components/records/types";
import { PurchaseEditForm } from "@/components/records/purchase-edit-form";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

type Props = {
  linkedTickets: CourseTicket[];
  linkedPurchases: Purchase[];
  salonId: string;
  recordId: string;
  customerId: string;
  deletingTicketId: string | null;
  deletingPurchaseId: string | null;
  onDeleteTicket: (ticketId: string) => void;
  onDeletePurchase: (purchaseId: string) => void;
  onPurchaseUpdated: (updated: Purchase) => void;
};

/** カルテ編集画面の紐づき回数券・物販の一覧表示（編集・削除ボタン付き） */
export function TreatmentLinkedItems({
  linkedTickets, linkedPurchases, salonId, recordId, customerId,
  deletingTicketId, deletingPurchaseId,
  onDeleteTicket, onDeletePurchase, onPurchaseUpdated,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ item_name: "", quantity: 1, unit_price: 0, memo: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDeleteTicket, setConfirmDeleteTicket] = useState<string | null>(null);
  const [confirmDeletePurchase, setConfirmDeletePurchase] = useState<string | null>(null);

  const startEdit = (p: Purchase) => {
    setEditingId(p.id);
    setEditForm({ item_name: p.item_name, quantity: p.quantity, unit_price: p.unit_price, memo: p.memo ?? "" });
  };

  const handleSave = async (purchase: Purchase) => {
    setSaving(true);
    const supabase = createClient();
    const q = Math.max(1, editForm.quantity);
    const up = Math.max(0, editForm.unit_price);
    const total = q * up;

    if (purchase.product_id && q !== purchase.quantity) {
      // 在庫連動 + 数量変更: reverse → re-record
      const { error: reverseErr } = await supabase.rpc("reverse_product_sale", { p_purchase_id: purchase.id });
      if (reverseErr) { console.error("reverse error:", reverseErr); setSaving(false); return; }
      const { error: rpcErr } = await supabase.rpc("record_product_sale", {
        p_salon_id: salonId, p_customer_id: customerId, p_product_id: purchase.product_id,
        p_quantity: q, p_sell_price: up,
        p_purchase_date: purchase.purchase_date, p_memo: editForm.memo || null, p_treatment_record_id: recordId,
      });
      if (rpcErr) { console.error("re-record error:", rpcErr); setSaving(false); return; }
      // 新しいIDで再取得
      const { data: newPurchases } = await supabase.from("purchases")
        .select("id, item_name, quantity, unit_price, total_price, memo, product_id")
        .eq("treatment_record_id", recordId).eq("product_id", purchase.product_id).eq("salon_id", salonId)
        .order("created_at", { ascending: false }).limit(1).returns<Purchase[]>();
      if (newPurchases?.[0]) onPurchaseUpdated(newPurchases[0]);
    } else if (purchase.product_id) {
      // 在庫連動 + メモのみ変更
      await supabase.from("purchases").update({ memo: editForm.memo || null }).eq("id", purchase.id).eq("salon_id", salonId);
      onPurchaseUpdated({ ...purchase, memo: editForm.memo || null });
    } else {
      // 自由入力: 全項目更新可
      const { error } = await supabase.from("purchases").update({
        item_name: editForm.item_name, quantity: q, unit_price: up, total_price: total, memo: editForm.memo || null,
      }).eq("id", purchase.id).eq("salon_id", salonId);
      if (error) { console.error("update error:", error); setSaving(false); return; }
      onPurchaseUpdated({ ...purchase, item_name: editForm.item_name, quantity: q, unit_price: up, total_price: total, memo: editForm.memo || null });
    }
    setEditingId(null);
    setSaving(false);
  };

  if (linkedTickets.length === 0 && linkedPurchases.length === 0) return null;

  return (
    <>
      {/* 紐づく回数券販売 */}
      {linkedTickets.length > 0 && (
        <div className="border-t border-border pt-3">
          <h3 className="text-sm font-bold mb-2">回数券販売</h3>
          <div className="space-y-2">
            {linkedTickets.map((ticket) => (
              <div key={ticket.id}>
                {confirmDeleteTicket === ticket.id ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-red-800">この回数券を削除しますか？</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setConfirmDeleteTicket(null)} className="flex-1 text-xs py-2 rounded-lg border border-border hover:bg-background min-h-[44px]">キャンセル</button>
                      <button type="button" onClick={() => { setConfirmDeleteTicket(null); onDeleteTicket(ticket.id); }} disabled={deletingTicketId === ticket.id} className="flex-1 text-xs py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 min-h-[44px]">{deletingTicketId === ticket.id ? "削除中..." : "削除する"}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-background rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ticket.ticket_name}</p>
                      <p className="text-xs text-text-light">{ticket.total_sessions}回{ticket.price != null ? ` / ${ticket.price.toLocaleString()}円` : ""}</p>
                    </div>
                    <button type="button" onClick={() => setConfirmDeleteTicket(ticket.id)} disabled={deletingTicketId === ticket.id}
                      className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50">
                      {deletingTicketId === ticket.id ? "削除中..." : "削除"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 紐づく物販記録 */}
      {linkedPurchases.length > 0 && (
        <div className="border-t border-border pt-3">
          <h3 className="text-sm font-bold mb-2">物販記録</h3>
          <div className="space-y-2">
            {linkedPurchases.map((purchase) => (
              <div key={purchase.id}>
                {confirmDeletePurchase === purchase.id ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-red-800">この物販記録を削除しますか？</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setConfirmDeletePurchase(null)} className="flex-1 text-xs py-2 rounded-lg border border-border hover:bg-background min-h-[44px]">キャンセル</button>
                      <button type="button" onClick={() => { setConfirmDeletePurchase(null); onDeletePurchase(purchase.id); }} disabled={deletingPurchaseId === purchase.id} className="flex-1 text-xs py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 min-h-[44px]">{deletingPurchaseId === purchase.id ? "削除中..." : "削除する"}</button>
                    </div>
                  </div>
                ) : editingId === purchase.id ? (
                  <PurchaseEditForm
                    purchase={purchase}
                    editForm={editForm}
                    saving={saving}
                    onUpdate={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
                    onSave={() => handleSave(purchase)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between bg-background rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{purchase.item_name}</p>
                      <p className="text-xs text-text-light">
                        {purchase.quantity}個 × {purchase.unit_price.toLocaleString()}円 = {purchase.total_price.toLocaleString()}円
                        {purchase.product_id && " (在庫連動)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button type="button" onClick={() => startEdit(purchase)}
                        className="text-accent text-xs px-2 py-1.5 rounded-lg hover:bg-accent/5 min-h-[44px]">
                        編集
                      </button>
                      <button type="button" onClick={() => setConfirmDeletePurchase(purchase.id)} disabled={deletingPurchaseId === purchase.id}
                        className="text-error text-xs px-2 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px] disabled:opacity-50">
                        {deletingPurchaseId === purchase.id ? "削除中..." : "削除"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {linkedPurchases.length > 1 && (
              <div className="flex items-center justify-between bg-accent/5 rounded-xl px-3 py-2">
                <span className="text-xs text-text-light">合計</span>
                <span className="text-sm font-bold text-accent">{linkedPurchases.reduce((s, p) => s + p.total_price, 0).toLocaleString()}円</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
