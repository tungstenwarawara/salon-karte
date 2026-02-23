"use client";

import { useState } from "react";
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
  /** 選択中の開始時間（分） */
  selectedStartMin: number | null;
  /** メニュー合計所要時間（分） */
  menuDuration: number;
  /** 編集ページの場合、現在の予約を除外するためのID */
  excludeAppointmentId?: string;
  onSlotClick: (hour: number, minute: number) => void;
};

type SlotState = "available" | "selected" | "duration-range" | "occupied" | "no-fit";

/** 時間帯のグループ定義 */
function getTimeGroup(minutes: number): string {
  if (minutes < 720) return "午前";   // 12:00 より前
  if (minutes < 960) return "午後";   // 16:00 より前
  return "夕方";
}

export function TimeSlotVisualization({
  appointmentDate,
  businessHours,
  salonHolidays,
  dayAppointments,
  selectedStartMin,
  menuDuration,
  excludeAppointmentId,
  onSlotClick,
}: Props) {
  const [interval, setInterval] = useState<30 | 15>(30);

  const schedule = getScheduleForDate(businessHours, appointmentDate, salonHolidays);
  if (!schedule.is_open) return null;

  const openMin = timeToMinutes(schedule.open_time);
  const closeMin = timeToMinutes(schedule.close_time);
  if (closeMin <= openMin) return null;

  const appointments = excludeAppointmentId
    ? dayAppointments.filter((a) => a.id !== excludeAppointmentId)
    : dayAppointments;

  // スロット生成
  const slots: number[] = [];
  for (let m = openMin; m < closeMin; m += interval) {
    slots.push(m);
  }

  // 予約済みスロットの判定
  const isOccupied = (slotMin: number): boolean => {
    return appointments.some((apt) => {
      const aStart = timeToMinutes(apt.start_time.slice(0, 5));
      const aEnd = apt.end_time ? timeToMinutes(apt.end_time.slice(0, 5)) : aStart + 60;
      return slotMin >= aStart && slotMin < aEnd;
    });
  };

  // 予約中の顧客名を取得
  const getOccupyingCustomer = (slotMin: number): string | null => {
    const apt = appointments.find((a) => {
      const aStart = timeToMinutes(a.start_time.slice(0, 5));
      const aEnd = a.end_time ? timeToMinutes(a.end_time.slice(0, 5)) : aStart + 60;
      return slotMin >= aStart && slotMin < aEnd;
    });
    if (!apt?.customers) return null;
    return `${apt.customers.last_name}${apt.customers.first_name}`;
  };

  // 施術時間が閉店までに収まるか判定
  const canFitDuration = (slotMin: number): boolean => {
    const effectiveDuration = menuDuration > 0 ? menuDuration : 60;
    if (slotMin + effectiveDuration > closeMin) return false;
    // 施術時間内に既存予約と重複しないかチェック
    for (let m = slotMin; m < slotMin + effectiveDuration; m += 15) {
      if (isOccupied(m)) return false;
    }
    return true;
  };

  // スロットの状態判定
  const getSlotState = (slotMin: number): SlotState => {
    if (isOccupied(slotMin)) return "occupied";
    if (selectedStartMin !== null && slotMin === selectedStartMin) return "selected";
    if (selectedStartMin !== null && menuDuration > 0) {
      const endMin = selectedStartMin + menuDuration;
      if (slotMin > selectedStartMin && slotMin < endMin) return "duration-range";
    }
    if (!canFitDuration(slotMin)) return "no-fit";
    return "available";
  };

  // 時間表示
  const formatSlotTime = (min: number): string => {
    return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  };

  // グループ化
  const groups: { label: string; slots: number[] }[] = [];
  let currentGroup = "";
  for (const slotMin of slots) {
    const group = getTimeGroup(slotMin);
    if (group !== currentGroup) {
      groups.push({ label: group, slots: [] });
      currentGroup = group;
    }
    groups[groups.length - 1].slots.push(slotMin);
  }

  // 選択中の終了予定時間
  const selectedEndMin = selectedStartMin !== null && menuDuration > 0
    ? selectedStartMin + menuDuration
    : null;

  return (
    <div className="space-y-3">
      {/* ヘッダー: 営業時間 + 間隔切替 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-light">
          営業時間: {schedule.open_time} 〜 {schedule.close_time}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setInterval(30)}
            className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${interval === 30 ? "bg-accent text-white" : "bg-background text-text-light"}`}
          >
            30分
          </button>
          <button
            type="button"
            onClick={() => setInterval(15)}
            className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${interval === 15 ? "bg-accent text-white" : "bg-background text-text-light"}`}
          >
            15分
          </button>
        </div>
      </div>

      {/* 選択サマリー */}
      {selectedStartMin !== null && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">
          <p className="text-sm font-medium text-accent">
            {formatSlotTime(selectedStartMin)}
            {selectedEndMin ? ` 〜 ${formatSlotTime(Math.min(selectedEndMin, 23 * 60 + 45))}（${menuDuration}分）` : " 〜"}
          </p>
        </div>
      )}

      {/* タイムスロットグリッド */}
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-medium text-text-light mb-1.5">{group.label}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {group.slots.map((slotMin) => {
              const state = getSlotState(slotMin);
              const customer = state === "occupied" ? getOccupyingCustomer(slotMin) : null;

              return (
                <button
                  key={slotMin}
                  type="button"
                  disabled={state === "occupied" || state === "no-fit" || state === "duration-range"}
                  onClick={() => onSlotClick(Math.floor(slotMin / 60), slotMin % 60)}
                  className={`rounded-xl py-2.5 text-sm transition-colors min-h-[48px] flex flex-col items-center justify-center ${
                    state === "selected"
                      ? "bg-accent text-white font-medium ring-2 ring-accent ring-offset-1"
                      : state === "duration-range"
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : state === "occupied"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : state === "no-fit"
                      ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                      : "bg-surface border border-border text-text hover:bg-accent/5 hover:border-accent/30"
                  }`}
                >
                  <span>{formatSlotTime(slotMin)}</span>
                  {state === "occupied" && customer && (
                    <span className="text-[10px] truncate max-w-full px-1">{customer}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* 凡例 */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-light pt-1">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-surface border border-border" />
          空き
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-accent" />
          選択中
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-200" />
          予約済み
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-gray-50 border border-gray-100" />
          時間不足
        </span>
      </div>
    </div>
  );
}
