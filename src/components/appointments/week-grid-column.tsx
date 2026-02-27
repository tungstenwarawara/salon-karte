"use client";

import { useRouter } from "next/navigation";
import { WeekAppointmentBlock } from "./week-appointment-block";
import type { WeekAppointment } from "./week-appointment-block";
import type { ResolvedSchedule } from "@/lib/staff-schedule";
import { timeToMinutes, toDateString } from "@/lib/business-hours";

export const HOUR_HEIGHT = 60;

export type ColumnDef = {
  key: string;
  label: string;
  dateStr: string;
  staffId: string | null;
  schedule: ResolvedSchedule;
  appointments: WeekAppointment[];
};

type Props = {
  column: ColumnDef;
  startHour: number;
  endHour: number;
};

/** 1カラム分の時間グリッド（1日 or 1スタッフ） */
export function WeekGridColumn({ column, startHour, endHour }: Props) {
  const router = useRouter();
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;
  const rangeStartMin = startHour * 60;

  const scheduleStartMin = timeToMinutes(column.schedule.startTime);
  const scheduleEndMin = timeToMinutes(column.schedule.endTime);

  const blocks = layoutAppointments(column.appointments, rangeStartMin);

  // 現在時刻ライン
  const now = new Date();
  const nowStr = toDateString(now);
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const showTimeLine = column.dateStr === nowStr && currentMin >= rangeStartMin && currentMin < endHour * 60;
  const timeLineTop = ((currentMin - rangeStartMin) / 60) * HOUR_HEIGHT;

  // 空きエリアタップ → 予約作成
  const handleEmptyTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = rangeStartMin + (y / HOUR_HEIGHT) * 60;
    const rounded = Math.floor(minutes / 15) * 15;
    const hour = Math.floor(rounded / 60);
    const min = rounded % 60;
    const timeParam = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const params = new URLSearchParams({ date: column.dateStr, time: timeParam });
    if (column.staffId) params.set("staff", column.staffId);
    router.push(`/appointments/new?${params.toString()}`);
  };

  return (
    <div className="relative border-l border-border cursor-pointer" style={{ height: `${totalHeight}px` }} onClick={handleEmptyTap}>
      {/* 1時間ごとの罫線 */}
      {Array.from({ length: endHour - startHour }, (_, i) => (
        <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-border/30 pointer-events-none" style={{ top: `${i * HOUR_HEIGHT}px` }} />
      ))}

      {/* 非勤務時間オーバーレイ */}
      {column.schedule.isWorking ? (
        <>
          {scheduleStartMin > rangeStartMin && (
            <div className="absolute left-0 right-0 bg-gray-100/50 pointer-events-none" style={{ top: 0, height: `${((scheduleStartMin - rangeStartMin) / 60) * HOUR_HEIGHT}px` }} />
          )}
          {scheduleEndMin < endHour * 60 && (
            <div className="absolute left-0 right-0 bg-gray-100/50 pointer-events-none" style={{ top: `${((scheduleEndMin - rangeStartMin) / 60) * HOUR_HEIGHT}px`, bottom: 0 }} />
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-400">休</span>
        </div>
      )}

      {/* 予約ブロック */}
      {blocks.map((b) => (
        <WeekAppointmentBlock key={b.appointment.id} appointment={b.appointment} top={b.top} height={b.height} left={b.left} width={b.width} />
      ))}

      {/* 現在時刻ライン */}
      {showTimeLine && (
        <div className="absolute left-0 right-0 h-[2px] bg-red-500 pointer-events-none z-20" style={{ top: `${timeLineTop}px` }} />
      )}
    </div>
  );
}

/** 重複予約のレイアウト計算 */
type LayoutBlock = { appointment: WeekAppointment; top: number; height: number; left: number; width: number };

function layoutAppointments(appointments: WeekAppointment[], rangeStartMin: number): LayoutBlock[] {
  const items = appointments
    .filter((a) => a.status !== "cancelled")
    .map((a) => ({
      appointment: a,
      startMin: timeToMinutes(a.start_time),
      endMin: a.end_time ? timeToMinutes(a.end_time) : timeToMinutes(a.start_time) + 30,
    }))
    .sort((a, b) => a.startMin - b.startMin);

  // 重複グループ分割
  const groups: (typeof items)[] = [];
  let current: typeof items = [];
  for (const item of items) {
    if (current.length === 0 || item.startMin < Math.max(...current.map((g) => g.endMin))) {
      current.push(item);
    } else {
      groups.push(current);
      current = [item];
    }
  }
  if (current.length > 0) groups.push(current);

  const blocks: LayoutBlock[] = [];
  for (const group of groups) {
    const n = group.length;
    group.forEach((item, i) => {
      blocks.push({
        appointment: item.appointment,
        top: ((item.startMin - rangeStartMin) / 60) * HOUR_HEIGHT,
        height: Math.max(((item.endMin - item.startMin) / 60) * HOUR_HEIGHT, 20),
        left: (i / n) * 100,
        width: 100 / n,
      });
    });
  }
  return blocks;
}
