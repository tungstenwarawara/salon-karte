"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "有効", color: "bg-green-100 text-green-700" },
  completed: { label: "消化済", color: "bg-gray-100 text-gray-500" },
  expired: { label: "期限切", color: "bg-red-100 text-red-500" },
  cancelled: { label: "取消", color: "bg-gray-100 text-gray-500" },
};

export function CourseTicketSection({
  customerId,
  initialTickets,
}: {
  customerId: string;
  initialTickets: CourseTicket[];
}) {
  const [tickets, setTickets] = useState<CourseTicket[]>(initialTickets);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [adjustError, setAdjustError] = useState("");

  const handleUseSession = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.used_sessions >= ticket.total_sessions) return;
    if (processingId) return;

    setProcessingId(ticketId);

    const supabase = createClient();

    const { data, error } = await supabase.rpc("use_course_ticket_session", {
      p_ticket_id: ticketId,
    }) as { data: { used_sessions: number; status: string } | null; error: typeof Error | null };

    if (!error && data) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, used_sessions: data.used_sessions, status: data.status }
            : t
        )
      );
    }

    setProcessingId(null);
  };

  const handleAdjust = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    if (editValue < 0 || editValue > ticket.total_sessions) {
      setAdjustError(`0〜${ticket.total_sessions}の範囲で入力してください`);
      return;
    }

    if (editValue === ticket.used_sessions) {
      setEditingId(null);
      return;
    }

    const remaining = ticket.total_sessions - editValue;
    if (!confirm(`消化回数を ${ticket.used_sessions} → ${editValue} に変更しますか？（残り${remaining}回になります）`)) {
      return;
    }

    setAdjustError("");
    setProcessingId(ticketId);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("adjust_course_ticket_sessions", {
      p_ticket_id: ticketId,
      p_new_used_sessions: editValue,
    }) as { data: { used_sessions: number; status: string } | null; error: typeof Error | null };

    if (!error && data) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, used_sessions: data.used_sessions, status: data.status }
            : t
        )
      );
      setEditingId(null);
    } else {
      setAdjustError("調整に失敗しました");
    }

    setProcessingId(null);
  };

  // 回数調整可能: active または completed のチケットのみ
  const canAdjust = (ticket: CourseTicket) =>
    ticket.status === "active" || ticket.status === "completed";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">コースチケット</h3>
        <Link
          href={`/customers/${customerId}/tickets/new`}
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center"
        >
          + チケット登録
        </Link>
      </div>
      <p className="text-xs text-text-light mb-3">
        施術と同時に登録する場合は、カルテ作成画面の「回数券を販売」から追加できます。
      </p>

      {tickets.length > 0 ? (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const remaining = ticket.total_sessions - ticket.used_sessions;
            const statusInfo =
              STATUS_LABELS[ticket.status] ?? STATUS_LABELS.active;
            const isActive = ticket.status === "active";
            const isEditing = editingId === ticket.id;
            return (
              <div
                key={ticket.id}
                className="bg-surface border border-border rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {ticket.ticket_name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-2xl font-bold text-accent">
                      {remaining}
                    </span>
                    <span className="text-text-light">
                      /{ticket.total_sessions}回 残り
                    </span>
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1.5">
                      {isActive && remaining > 0 && (
                        <button
                          onClick={() => handleUseSession(ticket.id)}
                          disabled={processingId !== null}
                          className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors min-h-[44px] disabled:opacity-50"
                        >
                          {processingId === ticket.id ? "処理中..." : "1回使用"}
                        </button>
                      )}
                      {canAdjust(ticket) && (
                        <button
                          onClick={() => {
                            setEditingId(ticket.id);
                            setEditValue(ticket.used_sessions);
                            setAdjustError("");
                          }}
                          className="text-xs text-text-light px-2 py-1.5 rounded-lg hover:bg-background transition-colors min-h-[44px]"
                        >
                          回数調整
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 回数調整インライン編集 */}
                {isEditing && (
                  <div className="bg-background rounded-xl p-3 space-y-2">
                    <p className="text-xs text-text-light">
                      消化回数を直接変更します（間違い修正用）
                    </p>
                    {adjustError && (
                      <p className="text-xs text-error">{adjustError}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-text-light shrink-0">
                        消化回数:
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={ticket.total_sessions}
                        value={editValue}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setEditValue(isNaN(v) ? 0 : v);
                          setAdjustError("");
                        }}
                        className="w-20 text-sm text-center rounded-lg border border-border bg-surface px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/50"
                      />
                      <span className="text-xs text-text-light">
                        / {ticket.total_sessions}回
                      </span>
                      <span className="text-xs font-medium text-accent">
                        （残 {ticket.total_sessions - editValue}回）
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setAdjustError("");
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-surface transition-colors min-h-[44px]"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => handleAdjust(ticket.id)}
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
                  {ticket.expiry_date && (
                    <span>期限: {ticket.expiry_date}</span>
                  )}
                  {ticket.price !== null && ticket.price > 0 && (
                    <span>{ticket.price.toLocaleString()}円</span>
                  )}
                </div>
                {ticket.memo && (
                  <p className="text-xs text-text-light">{ticket.memo}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
          コースチケットはまだありません
        </div>
      )}
    </div>
  );
}
