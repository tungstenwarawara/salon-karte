"use client";

import {
  isBusinessDay,
  isIrregularHoliday,
  getScheduleForDate,
  isWithinBusinessHours,
} from "@/lib/business-hours";
import type { BusinessHours } from "./types";

type ClosedDayProps = {
  appointmentDate: string;
  businessHours: BusinessHours;
  salonHolidays: string[] | null;
};

/** 休業日警告 */
export function ClosedDayWarning({ appointmentDate, businessHours, salonHolidays }: ClosedDayProps) {
  if (!appointmentDate || !businessHours) return null;
  if (isBusinessDay(businessHours, appointmentDate, salonHolidays)) return null;

  return (
    <div className="bg-warning/10 text-warning text-sm rounded-lg p-3">
      {isIrregularHoliday(salonHolidays, appointmentDate)
        ? "この日は臨時休業日に設定されています"
        : "この日は休業日に設定されています"}
    </div>
  );
}

type OutsideHoursProps = {
  appointmentDate: string;
  businessHours: BusinessHours;
  salonHolidays: string[] | null;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

/** 営業時間外の警告メッセージを返す（営業時間内ならnull） */
export function getOutsideHoursWarning({
  appointmentDate,
  businessHours,
  salonHolidays,
  startHour,
  startMinute,
  endHour,
  endMinute,
}: OutsideHoursProps): string | null {
  if (!businessHours || !appointmentDate) return null;
  if (!isBusinessDay(businessHours, appointmentDate, salonHolidays)) return null;

  const startStr = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
  const endStr = `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;

  if (isWithinBusinessHours(businessHours, appointmentDate, startStr, endStr, salonHolidays)) {
    return null;
  }

  const schedule = getScheduleForDate(businessHours, appointmentDate, salonHolidays);
  const isBefore = startStr < schedule.open_time;
  const isAfter = endStr > schedule.close_time;

  if (isBefore && isAfter) {
    return `開始（${startStr}）が営業開始（${schedule.open_time}）より前、終了（${endStr}）が営業終了（${schedule.close_time}）より後です`;
  }
  if (isBefore) {
    return `開始時間（${startStr}）が営業開始（${schedule.open_time}）より前です`;
  }
  return `終了時間（${endStr}）が営業終了（${schedule.close_time}）を超えています`;
}
