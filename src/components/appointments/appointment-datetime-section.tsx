"use client";

import { TimeSlotVisualization } from "@/components/appointments/time-slot-visualization";
import { TimePicker } from "@/components/appointments/time-picker";
import { ClosedDayWarning, getOutsideHoursWarning } from "@/components/appointments/business-hours-warning";
import { INPUT_CLASS } from "@/components/appointments/types";
import type { DayAppointment, BusinessHours } from "@/components/appointments/types";

type Props = {
  appointmentDate: string;
  onDateChange: (date: string) => void;
  businessHours: BusinessHours | null;
  salonHolidays: string[] | null;
  dayAppointments: DayAppointment[];
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  isEndTimeManual: boolean;
  selectedMenuIds: string[];
  onSlotClick: (h: number, m: number) => void;
  onStartHourChange: (h: string) => void;
  onStartMinuteChange: (m: string) => void;
  onEndHourChange: (h: string) => void;
  onEndMinuteChange: (m: string) => void;
  onResetAutoEndTime: () => void;
  /** 予約編集時の自分自身のIDを除外するため */
  excludeAppointmentId?: string;
};

/** 予約フォームの日付・時間選択セクション（新規・編集共用） */
export function AppointmentDateTimeSection({
  appointmentDate, onDateChange,
  businessHours, salonHolidays, dayAppointments,
  startHour, startMinute, endHour, endMinute,
  isEndTimeManual, selectedMenuIds,
  onSlotClick, onStartHourChange, onStartMinuteChange,
  onEndHourChange, onEndMinuteChange, onResetAutoEndTime,
  excludeAppointmentId,
}: Props) {
  const filteredAppointments = excludeAppointmentId
    ? dayAppointments.filter((a) => a.id !== excludeAppointmentId)
    : dayAppointments;

  return (
    <>
      {/* 予約日 */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-1.5">予約日</label>
        <input id="date" type="date" value={appointmentDate} onChange={(e) => onDateChange(e.target.value)} required className={INPUT_CLASS} />
      </div>

      {/* 休業日警告 */}
      {businessHours && (
        <ClosedDayWarning appointmentDate={appointmentDate} businessHours={businessHours} salonHolidays={salonHolidays} />
      )}

      {/* タイムスロット可視化 */}
      {appointmentDate && businessHours && (
        <TimeSlotVisualization
          appointmentDate={appointmentDate} businessHours={businessHours}
          salonHolidays={salonHolidays} dayAppointments={filteredAppointments}
          onSlotClick={onSlotClick}
        />
      )}

      {/* 開始時間 */}
      <TimePicker
        label="開始時間" hour={startHour} minute={startMinute}
        onHourChange={onStartHourChange} onMinuteChange={onStartMinuteChange}
      />

      {/* 終了予定時間 */}
      <TimePicker
        label="終了予定時間" hour={endHour} minute={endMinute}
        onHourChange={onEndHourChange} onMinuteChange={onEndMinuteChange}
        autoCalcInfo={{
          isManual: isEndTimeManual, hasMenus: selectedMenuIds.length > 0,
          onResetAuto: onResetAutoEndTime,
        }}
        warningMessage={businessHours ? getOutsideHoursWarning({
          appointmentDate, businessHours, salonHolidays,
          startHour, startMinute, endHour, endMinute,
        }) : null}
      />
    </>
  );
}
