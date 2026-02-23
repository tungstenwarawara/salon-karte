"use client";

import { useState } from "react";
import { TimeSlotVisualization } from "@/components/appointments/time-slot-visualization";
import { TimePicker } from "@/components/appointments/time-picker";
import { MiniCalendar } from "@/components/appointments/mini-calendar";
import { isBusinessDay, isIrregularHoliday } from "@/lib/business-hours";
import { getOutsideHoursWarning } from "@/components/appointments/business-hours-warning";
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
  /** メニュー合計所要時間（分） */
  menuDuration: number;
  onSlotClick: (h: number, m: number) => void;
  onStartHourChange: (h: string) => void;
  onStartMinuteChange: (m: string) => void;
  onEndHourChange: (h: string) => void;
  onEndMinuteChange: (m: string) => void;
  onResetAutoEndTime: () => void;
  /** 予約編集時の自分自身のIDを除外するため */
  excludeAppointmentId?: string;
  /** 日付ごとの予約件数（ミニカレンダー用） */
  appointmentCounts?: Record<string, number>;
  /** 月変更時の予約取得コールバック */
  onMonthChange?: (year: number, month: number) => void;
};

/** 予約フォームの日付・時間選択セクション（新規・編集共用） */
export function AppointmentDateTimeSection({
  appointmentDate, onDateChange,
  businessHours, salonHolidays, dayAppointments,
  startHour, startMinute, endHour, endMinute,
  isEndTimeManual, selectedMenuIds, menuDuration,
  onSlotClick, onStartHourChange, onStartMinuteChange,
  onEndHourChange, onEndMinuteChange, onResetAutoEndTime,
  excludeAppointmentId, appointmentCounts, onMonthChange,
}: Props) {
  const [showManualTime, setShowManualTime] = useState(false);

  const filteredAppointments = excludeAppointmentId
    ? dayAppointments.filter((a) => a.id !== excludeAppointmentId)
    : dayAppointments;

  const isClosedDay = businessHours
    ? !isBusinessDay(businessHours, appointmentDate, salonHolidays)
    : false;
  const isIrregular = isIrregularHoliday(salonHolidays, appointmentDate);

  const selectedStartMin = startHour && startMinute
    ? Number(startHour) * 60 + Number(startMinute)
    : null;

  return (
    <>
      {/* 予約日（ミニカレンダー） */}
      <div>
        <label className="block text-sm font-medium mb-1.5">予約日</label>
        <MiniCalendar
          selectedDate={appointmentDate}
          onDateChange={onDateChange}
          businessHours={businessHours}
          salonHolidays={salonHolidays}
          appointmentCounts={appointmentCounts}
          onMonthChange={onMonthChange}
        />
      </div>

      {/* 休業日メッセージ or タイムスロット */}
      {isClosedDay ? (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-warning">
            {isIrregular ? "この日は臨時休業日です" : "この日は休業日です"}
          </p>
          <p className="text-xs text-text-light">休業日でも予約登録は可能です</p>
          {!showManualTime ? (
            <button
              type="button"
              onClick={() => setShowManualTime(true)}
              className="text-xs text-accent hover:underline font-medium"
            >
              時間を手動で設定する
            </button>
          ) : (
            <div className="space-y-3 pt-1">
              <TimePicker
                label="開始時間" hour={startHour} minute={startMinute}
                onHourChange={onStartHourChange} onMinuteChange={onStartMinuteChange}
              />
              <TimePicker
                label="終了予定時間" hour={endHour} minute={endMinute}
                onHourChange={onEndHourChange} onMinuteChange={onEndMinuteChange}
                autoCalcInfo={{
                  isManual: isEndTimeManual, hasMenus: selectedMenuIds.length > 0,
                  onResetAuto: onResetAutoEndTime,
                }}
              />
            </div>
          )}
        </div>
      ) : businessHours ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium">開始時間を選択</label>
          <TimeSlotVisualization
            appointmentDate={appointmentDate}
            businessHours={businessHours}
            salonHolidays={salonHolidays}
            dayAppointments={filteredAppointments}
            selectedStartMin={selectedStartMin}
            menuDuration={menuDuration}
            excludeAppointmentId={excludeAppointmentId}
            onSlotClick={onSlotClick}
          />

          {/* 終了時間: デフォルトはサマリーのみ、手動変更も可能 */}
          {isEndTimeManual ? (
            <div className="space-y-2">
              <TimePicker
                label="終了予定時間" hour={endHour} minute={endMinute}
                onHourChange={onEndHourChange} onMinuteChange={onEndMinuteChange}
                autoCalcInfo={{
                  isManual: true, hasMenus: selectedMenuIds.length > 0,
                  onResetAuto: onResetAutoEndTime,
                }}
                warningMessage={getOutsideHoursWarning({
                  appointmentDate, businessHours, salonHolidays,
                  startHour, startMinute, endHour, endMinute,
                })}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEndHourChange(endHour)}
              className="text-xs text-text-light hover:text-accent transition-colors"
            >
              終了時間を手動で変更 →
            </button>
          )}
        </div>
      ) : (
        /* businessHoursが未設定の場合: 従来のTimePicker */
        <div className="space-y-3">
          <TimePicker
            label="開始時間" hour={startHour} minute={startMinute}
            onHourChange={onStartHourChange} onMinuteChange={onStartMinuteChange}
          />
          <TimePicker
            label="終了予定時間" hour={endHour} minute={endMinute}
            onHourChange={onEndHourChange} onMinuteChange={onEndMinuteChange}
            autoCalcInfo={{
              isManual: isEndTimeManual, hasMenus: selectedMenuIds.length > 0,
              onResetAuto: onResetAutoEndTime,
            }}
          />
        </div>
      )}
    </>
  );
}
