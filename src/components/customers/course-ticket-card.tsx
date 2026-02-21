"use client";

import type { Database } from "@/types/database";

type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "有効", color: "bg-green-100 text-green-700" },
  completed: { label: "消化済", color: "bg-gray-100 text-gray-500" },
  expired: { label: "期限切", color: "bg-red-100 text-red-500" },
  cancelled: { label: "取消", color: "bg-gray-100 text-gray-500" },
};

type Props = {
  ticket: CourseTicket;
  processingId: string | null;
  deletingId: string | null;
  editingId: string | null;
  editValue: number;
  adjustError: string;
  onUseSession: (ticketId: string) => void;
  onStartEdit: (ticketId: string, currentUsed: number) => void;
  onCancelEdit: () => void;
  onAdjust: (ticketId: string) => void;
  onEditValueChange: (value: number) => void;
  onDelete: (ticketId: string) => void;
};

/** 個別回数券カード */
export function CourseTicketCard({
  ticket, processingId, deletingId, editingId, editValue, adjustError,
  onUseSession, onStartEdit, onCancelEdit, onAdjust, onEditValueChange, onDelete,
}: Props) {
  const remaining = ticket.total_sessions - ticket.used_sessions;
  const statusInfo = STATUS_LABELS[ticket.status] ?? STATUS_LABELS.active;
  const isActive = ticket.status === "active";
  const isEditing = editingId === ticket.id;
  const canAdjust = ticket.status === "active" || ticket.status === "completed";

  return (
    <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{ticket.ticket_name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="text-2xl font-bold text-accent">{remaining}</span>
          <span className="text-text-light">/{ticket.total_sessions}回 残り</span>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1.5">
            {isActive && remaining > 0 && (
              <button
                onClick={() => onUseSession(ticket.id)}
                disabled={processingId !== null}
                className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors min-h-[44px] disabled:opacity-50"
              >
                {processingId === ticket.id ? "処理中..." : "1回使用"}
              </button>
            )}
            {canAdjust && (
              <button
                onClick={() => onStartEdit(ticket.id, ticket.used_sessions)}
                className="text-xs text-text-light px-2 py-1.5 rounded-lg hover:bg-background transition-colors min-h-[44px]"
              >
                回数調整
              </button>
            )}
            <button
              onClick={() => onDelete(ticket.id)}
              disabled={processingId !== null || deletingId !== null}
              className="text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 transition-colors min-h-[44px] disabled:opacity-50"
            >
              {deletingId === ticket.id ? "削除中..." : "削除"}
            </button>
          </div>
        )}
      </div>

      {/* 回数調整インライン編集 */}
      {isEditing && (
        <div className="bg-background rounded-xl p-3 space-y-2">
          <p className="text-xs text-text-light">消化回数を直接変更します（間違い修正用）</p>
          {adjustError && <p className="text-xs text-error">{adjustError}</p>}
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-light shrink-0">消化回数:</label>
            <input
              type="number"
              min={0}
              max={ticket.total_sessions}
              value={editValue}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                onEditValueChange(isNaN(v) ? 0 : v);
              }}
              className="w-20 text-sm text-center rounded-lg border border-border bg-surface px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
            <span className="text-xs text-text-light">/ {ticket.total_sessions}回</span>
            <span className="text-xs font-medium text-accent">
              （残 {ticket.total_sessions - editValue}回）
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancelEdit}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-surface transition-colors min-h-[44px]"
            >
              キャンセル
            </button>
            <button
              onClick={() => onAdjust(ticket.id)}
              disabled={processingId !== null}
              className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg hover:bg-accent-light transition-colors min-h-[44px] disabled:opacity-50"
            >
              {processingId === ticket.id ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-text-light">
        <span>購入: {ticket.purchase_date}</span>
        {ticket.expiry_date && <span>期限: {ticket.expiry_date}</span>}
        {ticket.price !== null && ticket.price > 0 && (
          <span>{ticket.price.toLocaleString()}円</span>
        )}
      </div>
      {ticket.memo && <p className="text-xs text-text-light">{ticket.memo}</p>}
    </div>
  );
}
