"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { CourseTicketCard } from "./course-ticket-card";

type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
          t.id === ticketId ? { ...t, used_sessions: data.used_sessions, status: data.status } : t
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
    if (editValue === ticket.used_sessions) { setEditingId(null); return; }

    const remaining = ticket.total_sessions - editValue;
    if (!confirm(`消化回数を ${ticket.used_sessions} → ${editValue} に変更しますか？（残り${remaining}回になります）`)) return;

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
          t.id === ticketId ? { ...t, used_sessions: data.used_sessions, status: data.status } : t
        )
      );
      setEditingId(null);
    } else {
      setAdjustError("調整に失敗しました");
    }
    setProcessingId(null);
  };

  const handleDelete = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const usedWarning = ticket.used_sessions > 0
      ? `\n\nこの回数券は${ticket.used_sessions}回消化済みです。削除すると施術記録の支払方法が「回数券なし」に変わります。`
      : "";
    const priceWarning = ticket.price && ticket.price > 0
      ? `\n売上から${ticket.price.toLocaleString()}円が差し引かれます。`
      : "";

    if (!confirm(`「${ticket.ticket_name}」を削除しますか？この操作は取り消せません。${usedWarning}${priceWarning}`)) return;

    setDeletingId(ticketId);
    const supabase = createClient();
    const { error } = await supabase.from("course_tickets").delete().eq("id", ticketId);
    if (error) {
      setAdjustError("削除に失敗しました");
      setDeletingId(null);
      return;
    }
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setDeletingId(null);
  };

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
          {tickets.map((ticket) => (
            <CourseTicketCard
              key={ticket.id}
              ticket={ticket}
              processingId={processingId}
              deletingId={deletingId}
              editingId={editingId}
              editValue={editValue}
              adjustError={adjustError}
              onUseSession={handleUseSession}
              onStartEdit={(id, used) => { setEditingId(id); setEditValue(used); setAdjustError(""); }}
              onCancelEdit={() => { setEditingId(null); setAdjustError(""); }}
              onAdjust={handleAdjust}
              onEditValueChange={(v) => { setEditValue(v); setAdjustError(""); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
          コースチケットはまだありません
        </div>
      )}
    </div>
  );
}
