"use client";

import { useState } from "react";
import { isBusinessDay, isIrregularHoliday } from "@/lib/business-hours";
import type { BusinessHours, DayAppointment, BookingSettings } from "./types";

type Props = {
  selectedDate: string; // "YYYY-MM-DD"
  onDateChange: (date: string) => void;
  businessHours: BusinessHours | null;
  salonHolidays: string[] | null;
  dayAppointments?: DayAppointment[];
  /** 月が変わった時に予約数を取得するためのコールバック */
  onMonthChange?: (year: number, month: number) => void;
  /** 日付ごとの予約件数（月変更時に親から渡される） */
  appointmentCounts?: Record<string, number>;
  /** 予約受付設定（当日不可など） */
  bookingSettings?: BookingSettings | null;
};

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function MiniCalendar({
  selectedDate,
  onDateChange,
  businessHours,
  salonHolidays,
  appointmentCounts,
  onMonthChange,
  bookingSettings,
}: Props) {
  const selected = parseDate(selectedDate);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const todayStr = toDateStr(new Date());
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = new Date(viewYear, viewMonth, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const navigateMonth = (offset: number) => {
    const d = new Date(viewYear, viewMonth + offset, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    onMonthChange?.(d.getFullYear(), d.getMonth());
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => navigateMonth(-1)}
          className="text-text-light hover:text-text p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
          ◀
        </button>
        <span className="text-sm font-medium">{viewYear}年{viewMonth + 1}月</span>
        <button type="button" onClick={() => navigateMonth(1)}
          className="text-text-light hover:text-text p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
          ▶
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((name, i) => (
          <div key={name} className={`text-center text-[10px] font-medium py-0.5 ${
            i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-text-light"
          }`}>
            {name}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;

          const cellDate = new Date(viewYear, viewMonth, day);
          const dateStr = toDateStr(cellDate);
          const isCellToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const dow = cellDate.getDay();
          const isHoliday = businessHours && !isBusinessDay(businessHours, cellDate, salonHolidays);
          const isIrregular = isIrregularHoliday(salonHolidays, cellDate);
          const count = appointmentCounts?.[dateStr] ?? 0;
          const isSameDayBlocked = isCellToday && bookingSettings?.same_day_enabled === false;

          return (
            <button
              key={day}
              type="button"
              disabled={isSameDayBlocked}
              onClick={() => !isSameDayBlocked && onDateChange(dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors relative ${
                isSameDayBlocked
                  ? "text-gray-300 bg-gray-50 line-through cursor-not-allowed"
                  : isSelected
                  ? "bg-accent text-white font-bold"
                  : isCellToday
                  ? "bg-accent/10 ring-1 ring-accent font-bold text-accent"
                  : isIrregular
                  ? "text-error/60 bg-error/5"
                  : isHoliday
                  ? "text-gray-300 bg-gray-50"
                  : dow === 0
                  ? "text-red-400 hover:bg-accent/5"
                  : dow === 6
                  ? "text-blue-400 hover:bg-accent/5"
                  : "text-text hover:bg-accent/5"
              }`}
            >
              <span>{day}</span>
              {count > 0 && (
                <div className="flex items-center justify-center">
                  {count <= 3 ? (
                    <div className="flex gap-0.5">
                      {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-accent"}`} />
                      ))}
                    </div>
                  ) : (
                    <span className={`text-[8px] font-bold ${isSelected ? "text-white" : "text-accent"}`}>{count}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
