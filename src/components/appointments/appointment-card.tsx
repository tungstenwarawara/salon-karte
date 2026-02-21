"use client";

import Link from "next/link";
import type { Database } from "@/types/database";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type AppointmentWithCustomer = Appointment & {
  customers: { last_name: string; first_name: string } | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "予定", color: "bg-blue-100 text-blue-700" },
  completed: { label: "来店済", color: "bg-green-100 text-green-700" },
  cancelled: { label: "キャンセル", color: "bg-gray-100 text-gray-500" },
};

const SOURCE_LABELS: Record<string, string> = {
  direct: "直接", hotpepper: "HP", phone: "電話", line: "LINE", other: "他",
};

function formatTime(time: string) { return time.slice(0, 5); }

type Props = {
  appointment: AppointmentWithCustomer;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
};

/** 予約一覧の個別カード表示 */
export function AppointmentCard({ appointment: apt, onStatusChange, onDelete }: Props) {
  const statusInfo = STATUS_LABELS[apt.status] ?? STATUS_LABELS.scheduled;
  const customer = apt.customers;

  return (
    <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{formatTime(apt.start_time)}{apt.end_time ? ` - ${formatTime(apt.end_time)}` : ""}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          {apt.source && apt.source !== "direct" && <span className="text-xs text-text-light">{SOURCE_LABELS[apt.source] ?? apt.source}</span>}
        </div>
        {apt.status === "scheduled" && (
          <Link href={`/appointments/${apt.id}/edit`} className="text-xs text-text-light hover:text-accent transition-colors">編集</Link>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Link href={`/customers/${apt.customer_id}`} className="font-medium text-sm hover:text-accent transition-colors">
          {customer ? `${customer.last_name} ${customer.first_name}` : "不明"}
        </Link>
        {apt.menu_name_snapshot && <span className="text-xs text-text-light">{apt.menu_name_snapshot}</span>}
      </div>

      {apt.memo && <p className="text-xs text-text-light">{apt.memo}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        {apt.status === "scheduled" && (
          <>
            <button onClick={() => onStatusChange(apt.id, "completed")} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors min-h-[32px]">来店済みにする</button>
            <button onClick={() => onStatusChange(apt.id, "cancelled")} className="text-xs bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors min-h-[32px]">キャンセル</button>
          </>
        )}
        {apt.status === "completed" && !apt.treatment_record_id && (
          <Link href={`/records/new?customer=${apt.customer_id}&appointment=${apt.id}`} className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors min-h-[32px] flex items-center">カルテを作成</Link>
        )}
        {apt.status === "completed" && apt.treatment_record_id && (
          <Link href={`/records/${apt.treatment_record_id}`} className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors min-h-[32px] flex items-center">カルテを見る</Link>
        )}
        {!apt.treatment_record_id && (
          <button onClick={() => onDelete(apt.id)} className="text-xs text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors min-h-[32px] ml-auto">削除</button>
        )}
      </div>
    </div>
  );
}

export { STATUS_LABELS, formatTime };
export type { AppointmentWithCustomer };
