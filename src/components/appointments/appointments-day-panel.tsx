"use client";

import Link from "next/link";
import type { BusinessHours } from "@/types/database";
import { isBusinessDay, isIrregularHoliday } from "@/lib/business-hours";
import { STATUS_LABELS, formatTime } from "@/components/appointments/appointment-card";
import { toDateStr, DAY_NAMES } from "@/components/appointments/appointments-calendar";
import type { AppointmentWithCustomer } from "@/components/appointments/appointment-card";

type Props = {
  selectedDate: Date;
  selectedDay: number;
  appointments: AppointmentWithCustomer[];
  businessHours: BusinessHours | null;
  salonHolidays: string[] | null;
  onDrillThrough: (date: Date) => void;
};

/** 月カレンダーの日別ドリルダウンパネル */
export function AppointmentsDayPanel({ selectedDate, selectedDay, appointments, businessHours, salonHolidays, onDrillThrough }: Props) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const dayDate = new Date(year, month, selectedDay);
  const dayStr = toDateStr(dayDate);

  const dayApts = appointments.filter((a) => a.appointment_date === dayStr);
  const activeApts = dayApts.filter((a) => a.status !== "cancelled");
  const isHoliday = businessHours && !isBusinessDay(businessHours, dayDate, salonHolidays);
  const isIrregular = isIrregularHoliday(salonHolidays, dayDate);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-sm">{month + 1}/{selectedDay}（{DAY_NAMES[dayDate.getDay()]}）</h4>
          {isIrregular && <span className="text-[10px] bg-error/10 text-error px-1.5 py-0.5 rounded-full">臨時休業</span>}
          {isHoliday && !isIrregular && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">休</span>}
          {activeApts.length > 0 && <span className="text-xs text-text-light">{activeApts.length}件</span>}
        </div>
        <button onClick={() => onDrillThrough(dayDate)} className="text-xs text-accent hover:underline">詳しく見る →</button>
      </div>

      {activeApts.length > 0 ? (
        <div className="space-y-1.5">
          {activeApts.map((apt) => (
            <Link key={apt.id} href={`/customers/${apt.customer_id}`}
              className="flex items-center gap-2 text-sm py-1.5 px-2 -mx-2 rounded-lg hover:bg-background transition-colors">
              <span className="font-medium tabular-nums text-accent w-11 shrink-0">{formatTime(apt.start_time)}</span>
              <span className="font-medium truncate">{apt.customers ? `${apt.customers.last_name} ${apt.customers.first_name}` : "不明"}</span>
              {apt.menu_name_snapshot && <span className="text-xs text-text-light truncate ml-auto shrink-0">{apt.menu_name_snapshot}</span>}
              {apt.status !== "scheduled" && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_LABELS[apt.status]?.color ?? ""}`}>{STATUS_LABELS[apt.status]?.label}</span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-light">{isIrregular ? "臨時休業日です" : isHoliday ? "休業日です" : "予約はありません"}</p>
      )}
    </div>
  );
}
