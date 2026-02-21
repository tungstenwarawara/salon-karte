"use client";

import type { CalendarDay } from "@/lib/calendar-utils";
import { WEEKDAY_HEADERS } from "@/lib/calendar-utils";

type Props = {
  viewYear: number;
  viewMonth: number;
  calendarDays: CalendarDay[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleHoliday: (dateStr: string) => void;
};

/** 不定休設定用カレンダーグリッド（月曜始まり） */
export function HolidayCalendarGrid({ viewYear, viewMonth, calendarDays, onPrevMonth, onNextMonth, onToggleHoliday }: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      {/* 月ナビ */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="font-bold text-lg">{viewYear}年{viewMonth}月</h3>
        <button type="button" onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_HEADERS.map((label, i) => (
          <div key={label} className={`text-xs font-medium py-1 ${i === 5 ? "text-blue-500" : i === 6 ? "text-error" : "text-text-light"}`}>
            {label}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cd) => {
          const canToggle = cd.isCurrentMonth && !cd.isPast && !cd.isWeeklyHoliday;
          const isDisabled = !cd.isCurrentMonth || cd.isPast || cd.isWeeklyHoliday;

          return (
            <button key={cd.dateStr} type="button"
              disabled={isDisabled && !cd.isIrregularHoliday}
              onClick={() => {
                if (canToggle) onToggleHoliday(cd.dateStr);
                else if (cd.isIrregularHoliday && cd.isCurrentMonth) onToggleHoliday(cd.dateStr);
              }}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors min-h-[48px]
                ${!cd.isCurrentMonth ? "opacity-30" : ""}
                ${cd.isPast && cd.isCurrentMonth && !cd.isIrregularHoliday ? "opacity-40" : ""}
                ${cd.isIrregularHoliday && cd.isCurrentMonth
                  ? "bg-error/15 border-2 border-error/40 text-error font-bold"
                  : cd.isWeeklyHoliday && cd.isCurrentMonth
                    ? "bg-border/50 text-text-light"
                    : canToggle ? "hover:bg-accent/10 active:bg-accent/20" : ""}
              `}>
              <span className="text-sm">{cd.day}</span>
              {cd.isWeeklyHoliday && cd.isCurrentMonth && !cd.isIrregularHoliday && (
                <span className="text-[9px] leading-none text-text-light">定休</span>
              )}
              {cd.isIrregularHoliday && cd.isCurrentMonth && (
                <span className="text-[9px] leading-none text-error font-bold">休み</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="flex gap-4 text-xs text-text-light pt-1">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-border/50" /><span>定休日</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-error/15 border border-error/40" /><span>不定休</span></div>
      </div>
    </div>
  );
}
