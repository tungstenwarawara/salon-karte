"use client";

import Link from "next/link";
import type { ResolvedSchedule, WeeklyStaffSchedule } from "@/lib/staff-schedule";
import { DAY_SHORT_LABELS, DAY_KEY_MAP, toDateString } from "@/lib/business-hours";

type ShiftWeeklyGridProps = {
  weekStartDate: Date;
  schedules: WeeklyStaffSchedule[];
  onCellTap: (staffId: string, staffName: string, dateStr: string, schedule: ResolvedSchedule) => void;
  selectedCell: { staffId: string; dateStr: string } | null;
};

/** 週間グリッド（行=スタッフ、列=月〜日） */
export function ShiftWeeklyGrid({ weekStartDate, schedules, onCellTap, selectedCell }: ShiftWeeklyGridProps) {
  // 7日分の日付を生成
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    dates.push(toDateString(d));
  }

  const today = toDateString(new Date());

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* ヘッダー行 */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="p-2" />
        {dates.map((dateStr) => {
          const d = new Date(dateStr + "T00:00:00");
          const dayKey = DAY_KEY_MAP[d.getDay()];
          const dayLabel = DAY_SHORT_LABELS[dayKey];
          const dayNum = d.getDate();
          const isToday = dateStr === today;
          const isSunday = d.getDay() === 0;
          const isSaturday = d.getDay() === 6;
          return (
            <div
              key={dateStr}
              className={`p-1.5 text-center text-xs ${isToday ? "bg-accent/10 font-bold" : ""}`}
            >
              <span className={isSunday ? "text-red-500" : isSaturday ? "text-blue-500" : "text-text-light"}>
                {dayLabel}
              </span>
              <br />
              <span className={`text-sm ${isToday ? "text-accent font-bold" : ""}`}>{dayNum}</span>
            </div>
          );
        })}
      </div>

      {/* スタッフ行 */}
      {schedules.map((staff) => (
        <div key={staff.staffId} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0">
          {/* スタッフ名 */}
          <Link
            href={`/settings/shifts/${staff.staffId}`}
            className="p-2 text-xs font-medium text-accent truncate flex items-center min-h-[48px] hover:underline"
          >
            {staff.staffName}
          </Link>
          {/* 7日分のセル */}
          {dates.map((dateStr) => {
            const schedule = staff.days[dateStr];
            if (!schedule) return <div key={dateStr} className="p-1" />;
            const isSelected = selectedCell?.staffId === staff.staffId && selectedCell?.dateStr === dateStr;
            return (
              <button
                key={dateStr}
                onClick={() => onCellTap(staff.staffId, staff.staffName, dateStr, schedule)}
                className={`p-1 text-center min-h-[48px] transition-colors ${getCellStyle(schedule, isSelected)}`}
              >
                {schedule.isWorking ? (
                  <span className="text-[11px] leading-tight block">
                    {formatTimeShort(schedule.startTime)}-{formatTimeShort(schedule.endTime)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">休</span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      {/* 空状態 */}
      {schedules.length === 0 && (
        <div className="p-6 text-center">
          <p className="text-text-light text-sm">アクティブなスタッフがいません</p>
        </div>
      )}
    </div>
  );
}

/** セルのスタイル（source + isWorking で色分け） */
function getCellStyle(schedule: ResolvedSchedule, isSelected: boolean): string {
  const base = isSelected ? "ring-2 ring-accent ring-inset" : "";
  if (schedule.source === "override") {
    return schedule.isWorking
      ? `bg-blue-50 border-l border-blue-200 ${base}`
      : `bg-red-50 border-l border-red-200 ${base}`;
  }
  return schedule.isWorking
    ? `bg-accent/5 hover:bg-accent/10 ${base}`
    : `bg-gray-50 hover:bg-gray-100 ${base}`;
}

/** "10:00" → "10" / "10:30" → "10:30" 省略表記 */
function formatTimeShort(time: string): string {
  const [h, m] = time.split(":");
  return m === "00" ? String(Number(h)) : `${Number(h)}:${m}`;
}
