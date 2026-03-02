"use client";

import { useState, useEffect } from "react";
import { DAY_KEY_MAP, DAY_SHORT_LABELS } from "@/lib/business-hours";
import type { BusinessHours, DaySchedule } from "@/types/database";

type DateMode = "normal" | "holiday" | "custom";

type Props = {
  dateStr: string;
  businessHours: BusinessHours;
  isHoliday: boolean;
  hourOverride: DaySchedule | null;
  defaultSchedule: DaySchedule;
  onSetNormal: () => void;
  onSetHoliday: () => void;
  onSetHourOverride: (openTime: string, closeTime: string) => void;
  onClose: () => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function TimeSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(":");
  const cls = "flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm min-h-[44px] focus:ring-2 focus:ring-accent/50 focus:border-accent";
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium min-w-[2.5rem]">{label}</span>
      <select value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)} className={cls}>
        {HOURS.map((hour) => <option key={hour} value={hour}>{hour}時</option>)}
      </select>
      <span className="text-text-light font-medium">:</span>
      <select value={m} onChange={(e) => onChange(`${h}:${e.target.value}`)} className={cls}>
        {MINUTES.map((min) => <option key={min} value={min}>{min}分</option>)}
      </select>
    </div>
  );
}

export function DateScheduleEditor({
  dateStr, businessHours, isHoliday, hourOverride, defaultSchedule,
  onSetNormal, onSetHoliday, onSetHourOverride, onClose,
}: Props) {
  const date = new Date(dateStr + "T00:00:00");
  const dayKey = DAY_KEY_MAP[date.getDay()];
  const dayLabel = DAY_SHORT_LABELS[dayKey];
  const mode: DateMode = isHoliday ? "holiday" : hourOverride ? "custom" : "normal";

  const [openTime, setOpenTime] = useState(hourOverride?.open_time ?? defaultSchedule.open_time);
  const [closeTime, setCloseTime] = useState(hourOverride?.close_time ?? defaultSchedule.close_time);

  useEffect(() => {
    setOpenTime(hourOverride?.open_time ?? defaultSchedule.open_time);
    setCloseTime(hourOverride?.close_time ?? defaultSchedule.close_time);
  }, [dateStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeChange = (newMode: DateMode) => {
    if (newMode === mode) return;
    if (newMode === "normal") onSetNormal();
    else if (newMode === "holiday") onSetHoliday();
    else onSetHourOverride(openTime, closeTime);
  };

  const handleTimeChange = (type: "open" | "close", value: string) => {
    const newOpen = type === "open" ? value : openTime;
    const newClose = type === "close" ? value : closeTime;
    if (type === "open") setOpenTime(value); else setCloseTime(value);
    onSetHourOverride(newOpen, newClose);
  };

  const modes: { key: DateMode; label: string; activeClass: string }[] = [
    { key: "normal", label: "通常営業", activeClass: "bg-emerald-50 text-emerald-700 border-2 border-emerald-300" },
    { key: "holiday", label: "臨時休業", activeClass: "bg-error/15 text-error border-2 border-error/40" },
    { key: "custom", label: "時間変更", activeClass: "bg-accent/15 text-accent border-2 border-accent/40" },
  ];

  return (
    <div className="bg-surface border border-accent/20 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">
          {date.getMonth() + 1}月{date.getDate()}日（{dayLabel}）の設定
        </p>
        <button type="button" onClick={onClose}
          className="text-text-light hover:text-text text-xs px-2 py-1 min-h-[44px] flex items-center">
          閉じる
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {modes.map(({ key, label, activeClass }) => (
          <button key={key} type="button" onClick={() => handleModeChange(key)}
            className={`py-2.5 rounded-xl text-xs font-medium transition-all min-h-[48px] ${
              mode === key ? activeClass : "bg-background border border-border text-text-light hover:border-accent/30"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {mode === "custom" && (
        <div className="bg-background rounded-xl p-3 space-y-2.5">
          <TimeSelect label="開店" value={openTime} onChange={(v) => handleTimeChange("open", v)} />
          <TimeSelect label="閉店" value={closeTime} onChange={(v) => handleTimeChange("close", v)} />
          {defaultSchedule.is_open && (
            <p className="text-[11px] text-text-light pt-0.5">
              通常: {defaultSchedule.open_time} 〜 {defaultSchedule.close_time}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
