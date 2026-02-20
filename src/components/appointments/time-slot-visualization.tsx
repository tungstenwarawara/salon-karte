"use client";

import {
  getScheduleForDate,
  timeToMinutes,
} from "@/lib/business-hours";
import type { BusinessHours, DayAppointment } from "./types";

type Props = {
  appointmentDate: string;
  businessHours: BusinessHours;
  salonHolidays: string[] | null;
  dayAppointments: DayAppointment[];
  /** 編集ページの場合、現在の予約を除外するためのID */
  excludeAppointmentId?: string;
  onSlotClick: (hour: number, minute: number) => void;
};

export function TimeSlotVisualization({
  appointmentDate,
  businessHours,
  salonHolidays,
  dayAppointments,
  excludeAppointmentId,
  onSlotClick,
}: Props) {
  const schedule = getScheduleForDate(businessHours, appointmentDate, salonHolidays);
  if (!schedule.is_open) return null;

  const openMin = timeToMinutes(schedule.open_time);
  const closeMin = timeToMinutes(schedule.close_time);
  const slotCount = (closeMin - openMin) / 15;
  if (slotCount <= 0) return null;

  const appointments = excludeAppointmentId
    ? dayAppointments.filter((a) => a.id !== excludeAppointmentId)
    : dayAppointments;

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-light">
        営業時間: {schedule.open_time} 〜 {schedule.close_time}
      </p>
      <div className="overflow-x-auto -mx-1 px-1">
        {/* 時刻ラベル行 */}
        <div className="flex gap-0.5 mb-1" style={{ minWidth: `${slotCount * 20}px` }}>
          {Array.from({ length: slotCount }, (_, i) => {
            const slotMin = openMin + i * 15;
            const isHourMark = slotMin % 60 === 0;
            return (
              <div key={slotMin} className="flex-shrink-0 text-center" style={{ width: "20px" }}>
                {isHourMark && (
                  <span className="text-[10px] text-text-light">
                    {Math.floor(slotMin / 60)}:00
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* スロットボタン行 */}
        <div className="flex gap-0.5" style={{ minWidth: `${slotCount * 20}px` }}>
          {Array.from({ length: slotCount }, (_, i) => {
            const slotMin = openMin + i * 15;
            const slotTime = `${String(Math.floor(slotMin / 60)).padStart(2, "0")}:${String(slotMin % 60).padStart(2, "0")}`;
            const isOccupied = appointments.some((apt) => {
              const aStart = timeToMinutes(apt.start_time.slice(0, 5));
              const aEnd = apt.end_time ? timeToMinutes(apt.end_time.slice(0, 5)) : aStart + 60;
              return slotMin >= aStart && slotMin < aEnd;
            });
            const occupyingApt = isOccupied
              ? appointments.find((apt) => {
                  const aStart = timeToMinutes(apt.start_time.slice(0, 5));
                  const aEnd = apt.end_time ? timeToMinutes(apt.end_time.slice(0, 5)) : aStart + 60;
                  return slotMin >= aStart && slotMin < aEnd;
                })
              : null;

            return (
              <button
                key={slotMin}
                type="button"
                title={
                  isOccupied && occupyingApt?.customers
                    ? `${slotTime} - ${occupyingApt.customers.last_name} ${occupyingApt.customers.first_name}様`
                    : slotTime
                }
                onClick={() => {
                  if (!isOccupied) {
                    onSlotClick(Math.floor(slotMin / 60), slotMin % 60);
                  }
                }}
                className={`h-8 flex-shrink-0 rounded-sm transition-colors ${
                  isOccupied
                    ? "bg-accent/30 cursor-not-allowed"
                    : "bg-accent/10 hover:bg-accent/20 cursor-pointer"
                }`}
                style={{ width: "20px" }}
              />
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-text-light">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-accent/30" />
          予約あり
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-accent/10" />
          空き
        </span>
      </div>
    </div>
  );
}
