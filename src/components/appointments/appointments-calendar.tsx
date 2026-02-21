"use client";

import type { BusinessHours } from "@/types/database";
import { isBusinessDay, isIrregularHoliday } from "@/lib/business-hours";
import type { AppointmentWithCustomer } from "@/components/appointments/appointment-card";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Props = {
  selectedDate: Date;
  appointments: AppointmentWithCustomer[];
  businessHours: BusinessHours | null;
  salonHolidays: string[] | null;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
};

/** 月カレンダーグリッド */
export function AppointmentsCalendar({ selectedDate, appointments, businessHours, salonHolidays, selectedDay, onSelectDay }: Props) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const todayStr = toDateStr(new Date());

  // 日付ごとにグルーピング
  const appointmentsByDate: Record<string, AppointmentWithCustomer[]> = {};
  for (const apt of appointments) {
    if (!appointmentsByDate[apt.appointment_date]) appointmentsByDate[apt.appointment_date] = [];
    appointmentsByDate[apt.appointment_date].push(apt);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((name, i) => (
          <div key={name} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-text-light"}`}>
            {name}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;

          const cellDate = new Date(year, month, day);
          const dateStr = toDateStr(cellDate);
          const isCellToday = dateStr === todayStr;
          const dayApts = appointmentsByDate[dateStr] ?? [];
          const activeCount = dayApts.filter((a) => a.status !== "cancelled").length;
          const dow = cellDate.getDay();
          const isHoliday = businessHours && !isBusinessDay(businessHours, cellDate, salonHolidays);
          const isIrregular = isIrregularHoliday(salonHolidays, cellDate);
          const isSelected = selectedDay === day;

          return (
            <button key={day} onClick={() => onSelectDay(selectedDay === day ? null : day)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-colors relative ${
                isCellToday ? "bg-accent text-white font-bold"
                  : isSelected ? "bg-accent/10 ring-2 ring-accent font-bold"
                  : isIrregular ? "text-error/60 bg-error/5"
                  : isHoliday ? "text-gray-300 bg-gray-50"
                  : dow === 0 ? "text-red-400"
                  : dow === 6 ? "text-blue-400"
                  : "text-text"
              } ${!isCellToday && !isSelected ? "hover:bg-accent/5" : ""}`}>
              <span className="text-sm">{day}</span>
              {activeCount > 0 && (
                <div className="flex items-center justify-center mt-0.5">
                  {activeCount <= 3 ? (
                    <div className="flex gap-0.5">
                      {Array.from({ length: activeCount }).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isCellToday ? "bg-white" : "bg-accent"}`} />
                      ))}
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold ${isCellToday ? "text-white" : "text-accent"}`}>{activeCount}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent" /><span className="text-[10px] text-text-light">予約あり</span></div>
        <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-accent">4</span><span className="text-[10px] text-text-light">件以上</span></div>
      </div>
    </div>
  );
}

export { toDateStr, DAY_NAMES };
