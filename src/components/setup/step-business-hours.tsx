"use client";

import { useState } from "react";
import type { BusinessHours } from "@/types/database";
import {
  DEFAULT_BUSINESS_HOURS,
  DAY_SHORT_LABELS,
  ORDERED_DAYS,
  generateTimeOptions,
} from "@/lib/business-hours";

const TIME_OPTIONS = generateTimeOptions();

export function StepBusinessHours({
  onNext,
  onSkip,
  initial,
}: {
  onNext: (hours: BusinessHours) => void;
  onSkip: () => void;
  initial?: BusinessHours | null;
}) {
  const [hours, setHours] = useState<BusinessHours>(() =>
    JSON.parse(JSON.stringify(initial ?? DEFAULT_BUSINESS_HOURS))
  );

  const toggleDay = (day: keyof BusinessHours) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], is_open: !prev[day].is_open },
    }));
  };

  const updateTime = (day: keyof BusinessHours, field: "open_time" | "close_time", value: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  return (
    <div className="space-y-5 animate-slide-in-right">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">営業時間の設定</h2>
        <p className="text-xs text-text-light">
          一般的な営業時間が入っています。必要な曜日だけ調整してください
        </p>
        <p className="text-[11px] text-text-light/70">
          不定休や当日予約の可否など、細かい設定はあとから変更できます
        </p>
      </div>

      {/* 曜日リスト */}
      <div className="space-y-2">
        {ORDERED_DAYS.map((day) => {
          const schedule = hours[day];
          return (
            <div
              key={day}
              className={`flex items-center gap-2 rounded-xl p-2.5 transition-colors ${
                schedule.is_open ? "bg-background" : "bg-border/20"
              }`}
            >
              {/* トグル */}
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className={`relative w-10 h-6 rounded-full shrink-0 transition-colors ${
                  schedule.is_open ? "bg-accent" : "bg-border"
                }`}
                aria-label={`${DAY_SHORT_LABELS[day]} ${schedule.is_open ? "営業" : "休み"}`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    schedule.is_open ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </button>

              {/* 曜日ラベル */}
              <span
                className={`text-sm font-medium w-5 text-center shrink-0 ${
                  day === "sunday" ? "text-error" : day === "saturday" ? "text-accent" : ""
                } ${!schedule.is_open ? "opacity-40" : ""}`}
              >
                {DAY_SHORT_LABELS[day]}
              </span>

              {/* 時間セレクト */}
              {schedule.is_open ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <select
                    value={schedule.open_time}
                    onChange={(e) => updateTime(day, "open_time", e.target.value)}
                    className="flex-1 min-w-0 text-sm rounded-lg border border-border bg-surface px-2 py-2.5 min-h-[44px] focus:outline-none focus:ring-1 focus:ring-accent/50"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <span className="text-text-light text-xs">〜</span>
                  <select
                    value={schedule.close_time}
                    onChange={(e) => updateTime(day, "close_time", e.target.value)}
                    className="flex-1 min-w-0 text-sm rounded-lg border border-border bg-surface px-2 py-2.5 min-h-[44px] focus:outline-none focus:ring-1 focus:ring-accent/50"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-sm text-text-light/50 flex-1">休み</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ボタンエリア */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onNext(hours)}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors min-h-[48px]"
        >
          次へ
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-sm text-text-light hover:text-accent transition-colors py-2 min-h-[44px]"
        >
          スキップ（あとで設定）
        </button>
      </div>
    </div>
  );
}
