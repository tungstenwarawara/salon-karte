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

  const handleUseSession = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.used_sessions >= ticket.total_sessions) return;
    if (processingId) return; // Prevent double-click

    setProcessingId(ticketId);

    const supabase = createClient();

    // アトミックにused_sessionsをインクリメント（競合状態を防止）
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">コースチケット</h3>
        <Link
          href={`/customers/${customerId}/tickets/new`}
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[40px] flex items-center"
        >
          + チケット登録
        </Link>
      </div>

      {tickets.length > 0 ? (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const remaining = ticket.total_sessions - ticket.used_sessions;
            const statusInfo =
              STATUS_LABELS[ticket.status] ?? STATUS_LABELS.active;
            const isActive = ticket.status === "active";
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
                  {isActive && remaining > 0 && (
                    <button
                      onClick={() => handleUseSession(ticket.id)}
                      disabled={processingId !== null}
                      className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors min-h-[32px] disabled:opacity-50"
                    >
                      {processingId === ticket.id ? "処理中..." : "1回使用する"}
                    </button>
                  )}
                </div>
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
