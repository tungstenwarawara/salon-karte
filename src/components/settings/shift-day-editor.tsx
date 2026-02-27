"use client";

import { useState } from "react";
import type { ResolvedSchedule } from "@/lib/staff-schedule";
import { generateTimeOptions, timeToMinutes, DAY_KEY_MAP, DAY_LABELS } from "@/lib/business-hours";

const TIME_OPTIONS = generateTimeOptions();

type ShiftDayEditorProps = {
  staffName: string;
  dateStr: string;
  schedule: ResolvedSchedule;
  saving: boolean;
  onSave: (isWorking: boolean, startTime: string, endTime: string) => void;
  onRemoveOverride: () => void;
  onClose: () => void;
};

const SOURCE_LABELS: Record<string, string> = {
  salon: "サロン設定",
  staff: "個別設定",
  override: "特別変更",
};

/** 日付指定のシフト編集パネル（インライン展開） */
export function ShiftDayEditor({ staffName, dateStr, schedule, saving, onSave, onRemoveOverride, onClose }: ShiftDayEditorProps) {
  const [isWorking, setIsWorking] = useState(schedule.isWorking);
  const [startTime, setStartTime] = useState(schedule.startTime);
  const [endTime, setEndTime] = useState(schedule.endTime);
  const [error, setError] = useState("");

  const date = new Date(dateStr + "T00:00:00");
  const dayKey = DAY_KEY_MAP[date.getDay()];
  const dayLabel = DAY_LABELS[dayKey];
  const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

  const handleSave = () => {
    setError("");
    if (isWorking && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError("終了時間は開始時間より後にしてください");
      return;
    }
    onSave(isWorking, startTime, endTime);
  };

  const selectClass = "rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  return (
    <div className="bg-background border border-border rounded-xl p-4 space-y-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-sm">{staffName}</span>
          <span className="text-text-light text-sm ml-2">{monthDay}（{dayLabel}）</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          schedule.source === "override" ? "bg-blue-100 text-blue-700" :
          schedule.source === "staff" ? "bg-accent/10 text-accent" :
          "bg-gray-100 text-gray-600"
        }`}>
          {SOURCE_LABELS[schedule.source]}
        </span>
      </div>

      {/* 出勤/休みトグル */}
      <div className="flex items-center justify-between">
        <span className="text-sm">{isWorking ? "出勤" : "休み"}</span>
        <button
          type="button"
          onClick={() => setIsWorking(!isWorking)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            isWorking ? "bg-accent" : "bg-border"
          }`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
            isWorking ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
      </div>

      {/* 時間選択（出勤時のみ） */}
      {isWorking && (
        <div className="flex items-center gap-2">
          <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className={selectClass}>
            {TIME_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <span className="text-text-light text-sm">〜</span>
          <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className={selectClass}>
            {TIME_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}

      {/* ボタン */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-surface border border-border text-text text-sm font-medium rounded-xl py-2.5 transition-colors min-h-[44px]"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl py-2.5 transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

      {/* 特別変更を解除 */}
      {schedule.source === "override" && (
        <button
          type="button"
          onClick={onRemoveOverride}
          disabled={saving}
          className="w-full text-xs text-text-light hover:text-error py-1 transition-colors min-h-[44px]"
        >
          特別変更を解除（元のスケジュールに戻す）
        </button>
      )}
    </div>
  );
}
