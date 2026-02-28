"use client";

import Link from "next/link";
import type { Database } from "@/types/database";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type AppointmentWithCustomer = Appointment & {
  customers: { last_name: string; first_name: string } | null;
  staff: { name: string } | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "予定", color: "bg-blue-100 text-blue-700" },
  completed: { label: "来店済", color: "bg-green-100 text-green-700" },
  cancelled: { label: "キャンセル", color: "bg-gray-100 text-gray-500" },
};

function formatTime(time: string) { return time.slice(0, 5); }

/** 予約一覧の個別カード — タップで予約詳細へ遷移 */
export function AppointmentCard({ appointment: apt }: { appointment: AppointmentWithCustomer }) {
  const statusInfo = STATUS_LABELS[apt.status] ?? STATUS_LABELS.scheduled;
  const customer = apt.customers;

  // 来店済みだがカルテ未作成: オレンジ左ボーダー
  const needsKarte = apt.status === "completed" && !apt.treatment_record_id;
  const borderClass = needsKarte
    ? "border-l-4 border-l-orange-400"
    : apt.status === "completed" && apt.treatment_record_id
      ? "border-l-4 border-l-green-400"
      : "";

  return (
    <Link
      href={`/appointments/${apt.id}`}
      className={`block bg-surface border border-border rounded-xl p-3 hover:border-accent hover:shadow-sm active:scale-[0.98] transition-all duration-200 ${borderClass}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tabular-nums">
            {formatTime(apt.start_time)}{apt.end_time ? ` - ${formatTime(apt.end_time)}` : ""}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {customer ? `${customer.last_name} ${customer.first_name}` : "不明"}
          </span>
          {apt.staff?.name && (
            <span className="text-xs text-text-light">担当: {apt.staff.name}</span>
          )}
        </div>
        {apt.menu_name_snapshot && (
          <span className="text-xs text-text-light">{apt.menu_name_snapshot}</span>
        )}
      </div>
    </Link>
  );
}

export { STATUS_LABELS, formatTime };
export type { AppointmentWithCustomer };
