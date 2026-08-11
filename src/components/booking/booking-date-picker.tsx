"use client";

import { useState, useEffect, useCallback } from "react";
import { getScheduleForDate, toDateString } from "@/lib/business-hours";
import type { BusinessHours, HourOverrides } from "@/types/database";

type SlotInfo = {
  time: string;
  available: boolean;
  reason?: "occupied" | "lead_time" | "exceeds_close" | "overlap_during";
};

type Props = {
  slug: string;
  selectedDate: string;
  selectedTime: string;
  totalDuration: number;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  businessHours: BusinessHours | null;
  salonHolidays: string[] | null;
  hourOverrides?: HourOverrides | null;
  /** 予約変更時: このトークンの予約を除外して空き枠を計算する */
  changeToken?: string;
};

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function NavBtn({ onClick, disabled, d }: { onClick: () => void; disabled: boolean; d: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface transition-colors disabled:opacity-30">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
    </button>
  );
}

function slotReasonLabel(reason?: string): string {
  switch (reason) {
    case "occupied": return "予約済みです";
    case "lead_time": return "受付締切を過ぎています";
    case "exceeds_close": return "閉店までに施術が終わりません";
    case "overlap_during": return "施術中の時間帯に予約が入っています";
    default: return "予約できません";
  }
}

function generateWeekDates(weekOffset: number): Date[] {
  const base = new Date();
  base.setDate(base.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

export function BookingDatePicker({
  slug,
  selectedDate,
  selectedTime,
  totalDuration,
  onDateChange,
  onTimeChange,
  businessHours,
  salonHolidays,
  hourOverrides,
  changeToken,
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const todayStr = toDateString(new Date());
  const dates = generateWeekDates(weekOffset);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!selectedDate) onDateChange(todayStr); }, []);

  const fetchSlots = useCallback(async (date: string) => {
    setLoadingSlots(true);
    setSlots([]);
    try {
      // 変更モード時は変更APIから空き枠を取得（自分の予約を除外）
      const url = changeToken
        ? `/api/booking/change?token=${changeToken}&date=${date}&duration=${totalDuration}`
        : `/api/booking/${slug}?date=${date}&duration=${totalDuration}`;
      const res = await fetch(url);
      if (res.ok) setSlots((await res.json()).slots ?? []);
    } catch { /* ネットワークエラー */ }
    finally { setLoadingSlots(false); }
  }, [slug, totalDuration, changeToken]);

  useEffect(() => { if (selectedDate) fetchSlots(selectedDate); }, [selectedDate, fetchSlots]);

  // メニューを選び直して施術時間が変わると、選択済みの時間が空き枠でなくなることがある
  // （例: 30分メニューで19:30を選択 → 90分に変更すると閉店を超える / 他の予約と重なる）
  // 古い選択が残ったままだと確認画面まで進めてしまうため、無効になった時点で解除する
  useEffect(() => {
    if (!selectedTime || loadingSlots || slots.length === 0) return;
    if (!slots.some((s) => s.time === selectedTime && s.available)) onTimeChange("");
  }, [slots, loadingSlots, selectedTime, onTimeChange]);

  const isOpen = (d: Date) => getScheduleForDate(businessHours, d, salonHolidays, hourOverrides).is_open;
  const isPast = (d: Date) => toDateString(d) < todayStr;
  const weekLabel = dates[0].getMonth() === dates[6].getMonth()
    ? `${dates[0].getFullYear()}年${dates[0].getMonth() + 1}月`
    : `${dates[0].getMonth() + 1}月 〜 ${dates[6].getMonth() + 1}月`;

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="space-y-4">
      {/* 日付選択 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <NavBtn onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} disabled={weekOffset === 0} d="M15.75 19.5L8.25 12l7.5-7.5" />
          <span className="text-sm font-medium">{weekLabel}</span>
          <NavBtn onClick={() => setWeekOffset(Math.min(8, weekOffset + 1))} disabled={weekOffset >= 8} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dates.map((date) => {
            const dateStr = toDateString(date);
            const isToday = dateStr === todayStr;
            const dayOpen = isOpen(date);
            const dayPast = isPast(date);
            const isSelected = dateStr === selectedDate;
            const disabled = !dayOpen || dayPast;
            const isSun = date.getDay() === 0;
            const isSat = date.getDay() === 6;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => !disabled && onDateChange(dateStr)}
                disabled={disabled}
                className={`flex flex-col items-center py-2 rounded-xl text-xs transition-colors min-h-[48px] ${
                  isSelected
                    ? "bg-accent text-white"
                    : disabled
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-accent/10"
                } ${isToday && !isSelected ? "ring-1 ring-accent" : ""}`}
              >
                <span className={`text-[10px] mb-0.5 ${
                  isSelected ? "text-white/80" : isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-text-light"
                }`}>
                  {DAY_LABELS[date.getDay()]}
                </span>
                <span className="font-bold text-sm">{date.getDate()}</span>
                {!dayOpen && !dayPast && (
                  <span className={`text-[9px] mt-0.5 ${isSelected ? "text-white/60" : "text-text-light"}`}>休</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 時間スロット */}
      {selectedDate && (
        <div>
          <p className="text-sm font-medium mb-2">
            時間を選択
            {availableSlots.length > 0 && (
              <span className="text-text-light font-normal ml-1">
                ({availableSlots.length}枠)
              </span>
            )}
          </p>

          {loadingSlots ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-6 text-sm text-text-light bg-surface rounded-xl">
              この日は予約を受け付けていません
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-6 text-sm text-text-light bg-surface rounded-xl">
              {slots.some((s) => s.reason === "exceeds_close" || s.reason === "overlap_during")
                ? "選択メニューの施術時間に合う空きがありません。別の日をお選びください"
                : "空きがありません。別の日をお選びください"
              }
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => slot.available && onTimeChange(slot.time)}
                    disabled={!slot.available}
                    title={!slot.available ? slotReasonLabel(slot.reason) : undefined}
                    className={`rounded-xl py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                      selectedTime === slot.time
                        ? "bg-accent text-white"
                        : slot.available
                        ? "bg-surface border border-border hover:border-accent/30"
                        : "bg-border/10 text-text-light/40 cursor-not-allowed"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
              {/* 不可理由の凡例 */}
              {slots.some((s) => !s.available) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-text-light">
                  {slots.some((s) => s.reason === "occupied") && <span>グレー枠 = 予約済み</span>}
                  {slots.some((s) => s.reason === "lead_time") && <span>グレー枠 = 受付締切済み</span>}
                  {slots.some((s) => s.reason === "exceeds_close") && <span>グレー枠 = 閉店までに終わらない</span>}
                  {slots.some((s) => s.reason === "overlap_during") && <span>グレー枠 = 施術中に空きなし</span>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
