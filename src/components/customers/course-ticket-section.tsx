"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { setFlashToast } from "@/components/ui/toast";
import { useIncrementalList } from "@/hooks/use-incremental-list";
import type { Database } from "@/types/database";
import { CourseTicketCard } from "./course-ticket-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { TicketConsumptionEntry } from "./customer-detail-content";

type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];

export function CourseTicketSection({
  customerId,
  salonId,
  initialTickets,
  consumptionHistory,
}: {
  customerId: string;
  salonId: string;
  initialTickets: CourseTicket[];
  consumptionHistory: Map<string, TicketConsumptionEntry[]>;
}) {
  const [tickets, setTickets] = useState<CourseTicket[]>(initialTickets);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [adjustError, setAdjustError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // アクティブ/過去を分離
  const activeTickets = tickets.filter((t) => t.status === "active");
  const pastTickets = tickets.filter((t) => t.status !== "active");
  const { displayItems: displayPastTickets, hasMore, remaining, showMore, collapse, isExpanded } =
    useIncrementalList(pastTickets, 5, 3);

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
      const remaining = (ticket.total_sessions) - data.used_sessions;
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, used_sessions: data.used_sessions, status: data.status } : t
        )
      );
      setFlashToast(`1回消化しました（残り${remaining}回）`);
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
    setConfirmDeleteId(null);
    setDeletingId(ticketId);
    const supabase = createClient();
    const { error } = await supabase.from("course_tickets").delete().eq("id", ticketId).eq("salon_id", salonId);
    if (error) {
      setAdjustError("削除に失敗しました");
      setDeletingId(null);
      return;
    }
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setDeletingId(null);
  };

  const ticketCardProps = (ticket: CourseTicket) => ({
    ticket,
    processingId,
    deletingId,
    editingId,
    editValue,
    adjustError,
    confirmDeleteId,
    consumptionEntries: consumptionHistory.get(ticket.id) ?? [],
    onUseSession: handleUseSession,
    onStartEdit: (id: string, used: number) => { setEditingId(id); setEditValue(used); setAdjustError(""); },
    onCancelEdit: () => { setEditingId(null); setAdjustError(""); },
    onAdjust: handleAdjust,
    onEditValueChange: (v: number) => { setEditValue(v); setAdjustError(""); },
    onRequestDelete: (id: string) => setConfirmDeleteId(id),
    onConfirmDelete: handleDelete,
    onCancelDelete: () => setConfirmDeleteId(null),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">コースチケット</h3>
        <Link
          href={`/customers/${customerId}/tickets/new`}
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center"
        >
          + 回数券を登録
        </Link>
      </div>
      <p className="text-xs text-text-light mb-3">
        施術と同時に登録する場合は、カルテ作成画面の「回数券を販売」から追加できます。
        <br />
        カルテで回数券支払いを選んだ場合は保存時に自動消化されるため、手動消化は不要です。
      </p>

      {tickets.length > 0 ? (
        <div>
          {/* アクティブな回数券（常に全表示） */}
          {activeTickets.length > 0 && (
            <div className="space-y-2">
              {activeTickets.map((ticket) => (
                <CourseTicketCard key={ticket.id} {...ticketCardProps(ticket)} />
              ))}
            </div>
          )}

          {/* 過去の回数券（段階的表示） */}
          {pastTickets.length > 0 && (
            <div className={activeTickets.length > 0 ? "mt-3" : ""}>
              <p className="text-xs text-text-light font-medium mb-1">過去の回数券</p>
              <div className="space-y-2">
                {displayPastTickets.map((ticket) => (
                  <CourseTicketCard key={ticket.id} {...ticketCardProps(ticket)} />
                ))}
              </div>
              {hasMore && (
                <button
                  onClick={showMore}
                  className="w-full text-center text-sm text-accent py-2 min-h-[44px] mt-2"
                >
                  もっと見る（残り{remaining}件）
                </button>
              )}
              {isExpanded && (
                <button
                  onClick={collapse}
                  className="w-full text-center text-sm text-text-light py-2 min-h-[44px]"
                >
                  閉じる
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          illustration="record"
          message="コースチケットはまだありません"
          action={{ label: "最初の回数券を登録する →", href: `/customers/${customerId}/tickets/new` }}
        />
      )}
    </div>
  );
}
