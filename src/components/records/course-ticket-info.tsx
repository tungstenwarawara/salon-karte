"use client";

import type { CourseTicket } from "./types";

type Props = {
  courseTickets: CourseTicket[];
};

export function CourseTicketInfo({ courseTickets }: Props) {
  if (courseTickets.length === 0) return null;

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 space-y-2">
      <h3 className="text-sm font-bold">
        有効な回数券（{courseTickets.length}件）
      </h3>
      {courseTickets.map((t) => {
        const remaining = t.total_sessions - t.used_sessions;
        return (
          <div key={t.id} className="flex items-center justify-between">
            <span className="text-sm">{t.ticket_name}</span>
            <span className="text-sm font-bold text-accent">
              残 {remaining}/{t.total_sessions}回
            </span>
          </div>
        );
      })}
      <p className="text-xs text-text-light">
        支払方法で「回数券」を選ぶと消化できます
      </p>
    </div>
  );
}
