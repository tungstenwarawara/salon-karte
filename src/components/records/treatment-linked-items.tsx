"use client";

import type { Database } from "@/types/database";
import type { CourseTicket } from "@/components/records/types";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

type Props = {
  linkedTickets: CourseTicket[];
  linkedPurchases: Purchase[];
  deletingTicketId: string | null;
  deletingPurchaseId: string | null;
  onDeleteTicket: (ticketId: string) => void;
  onDeletePurchase: (purchaseId: string) => void;
};

/** カルテ編集画面の紐づき回数券・物販の一覧表示（削除ボタン付き） */
export function TreatmentLinkedItems({
  linkedTickets, linkedPurchases,
  deletingTicketId, deletingPurchaseId,
  onDeleteTicket, onDeletePurchase,
}: Props) {
  if (linkedTickets.length === 0 && linkedPurchases.length === 0) return null;

  return (
    <>
      {/* 紐づく回数券販売 */}
      {linkedTickets.length > 0 && (
        <div className="border-t border-border pt-3">
          <h3 className="text-sm font-bold mb-2">回数券販売</h3>
          <div className="space-y-2">
            {linkedTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between bg-background rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ticket.ticket_name}</p>
                  <p className="text-xs text-text-light">{ticket.total_sessions}回{ticket.price != null ? ` / ${ticket.price.toLocaleString()}円` : ""}</p>
                </div>
                <button type="button" onClick={() => onDeleteTicket(ticket.id)} disabled={deletingTicketId === ticket.id}
                  className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50">
                  {deletingTicketId === ticket.id ? "削除中..." : "削除"}
                </button>
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
              <div key={purchase.id} className="flex items-center justify-between bg-background rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{purchase.item_name}</p>
                  <p className="text-xs text-text-light">
                    {purchase.quantity}個 × {purchase.unit_price.toLocaleString()}円 = {purchase.total_price.toLocaleString()}円
                    {purchase.product_id && " (在庫連動)"}
                  </p>
                </div>
                <button type="button" onClick={() => onDeletePurchase(purchase.id)} disabled={deletingPurchaseId === purchase.id}
                  className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50">
                  {deletingPurchaseId === purchase.id ? "削除中..." : "削除"}
                </button>
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
