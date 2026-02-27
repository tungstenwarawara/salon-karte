"use client";

import Link from "next/link";

export type WeekAppointment = {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  menu_name_snapshot: string | null;
  customers: { last_name: string; first_name: string } | null;
  staff: { name: string } | null;
};

type Props = {
  appointment: WeekAppointment;
  top: number;
  height: number;
  left: number;
  width: number;
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-accent/15 border-l-2 border-accent",
  completed: "bg-green-100 border-l-2 border-green-400",
  cancelled: "bg-gray-100 border-l-2 border-gray-300 opacity-50",
};

function formatTimeShort(time: string) {
  return time.slice(0, 5);
}

/** 週間カレンダーの予約ブロック（時間軸上に絶対配置） */
export function WeekAppointmentBlock({ appointment, top, height, left, width }: Props) {
  const style = STATUS_STYLES[appointment.status] ?? STATUS_STYLES.scheduled;
  const customerName = appointment.customers
    ? `${appointment.customers.last_name} ${appointment.customers.first_name}`
    : "不明";
  const timeStr = appointment.end_time
    ? `${formatTimeShort(appointment.start_time)}-${formatTimeShort(appointment.end_time)}`
    : formatTimeShort(appointment.start_time);

  return (
    <Link
      href={`/appointments/${appointment.id}`}
      className={`absolute rounded-lg overflow-hidden px-1 py-0.5 ${style} hover:opacity-80 transition-opacity z-10`}
      style={{ top: `${top}px`, height: `${Math.max(height, 22)}px`, left: `${left}%`, width: `${width}%` }}
      onClick={(e) => e.stopPropagation()}
    >
      {height >= 45 ? (
        <>
          <p className="text-[10px] text-text-light leading-tight truncate">{timeStr}</p>
          <p className="text-[11px] font-medium leading-tight truncate">{customerName}</p>
          {appointment.menu_name_snapshot && (
            <p className="text-[10px] text-text-light leading-tight truncate">{appointment.menu_name_snapshot}</p>
          )}
        </>
      ) : height >= 30 ? (
        <>
          <p className="text-[10px] text-text-light leading-tight truncate">{timeStr}</p>
          <p className="text-[11px] font-medium leading-tight truncate">{customerName}</p>
        </>
      ) : (
        <p className="text-[10px] font-medium leading-tight truncate">{customerName}</p>
      )}
    </Link>
  );
}
