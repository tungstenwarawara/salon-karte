"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_BUSINESS_HOURS,
  DAY_SHORT_LABELS,
  ORDERED_DAYS,
  generateTimeOptions,
  timeToMinutes,
  minutesToTime,
} from "@/lib/business-hours";
import { HelpTip } from "@/components/ui/help-tip";
import type { BusinessHours } from "@/types/database";

type Props = {
  mode: "interval" | "fixed";
  times: string[];
  businessHours: BusinessHours | null;
  onModeChange: (mode: "interval" | "fixed") => void;
  onTimesChange: (times: string[]) => void;
};

/** 営業している曜日全体で、最も早い開店時刻と最も遅い閉店時刻を求める */
function openRange(businessHours: BusinessHours | null): { min: number; max: number } | null {
  const hours = businessHours ?? DEFAULT_BUSINESS_HOURS;
  const openDays = ORDERED_DAYS.map((d) => hours[d]).filter((s) => s.is_open);
  if (openDays.length === 0) return null;
  return {
    min: Math.min(...openDays.map((s) => timeToMinutes(s.open_time))),
    max: Math.max(...openDays.map((s) => timeToMinutes(s.close_time))),
  };
}

/**
 * その時刻が営業時間外になる曜日の短縮名を返す
 *
 * 曜日ごとに営業時間が違う場合（例: 土曜だけ19:00閉店）、全体の範囲には収まっていても
 * 特定の曜日だけ枠が出ない。オーナーが気づけないと「土曜だけ予約が入らない」状態になる。
 */
function outOfRangeDays(businessHours: BusinessHours | null, time: string): string[] {
  const hours = businessHours ?? DEFAULT_BUSINESS_HOURS;
  const m = timeToMinutes(time);
  return ORDERED_DAYS.filter((d) => {
    const s = hours[d];
    if (!s.is_open) return false; // 休業日はもともと枠が出ないので対象外
    return m < timeToMinutes(s.open_time) || m >= timeToMinutes(s.close_time);
  }).map((d) => DAY_SHORT_LABELS[d]);
}

/** 営業している曜日の数 */
function openDayCount(businessHours: BusinessHours | null): number {
  const hours = businessHours ?? DEFAULT_BUSINESS_HOURS;
  return ORDERED_DAYS.filter((d) => hours[d].is_open).length;
}

export function BookingSlotTimes({
  mode,
  times,
  businessHours,
  onModeChange,
  onTimesChange,
}: Props) {
  const range = useMemo(() => openRange(businessHours), [businessHours]);
  const [pending, setPending] = useState("");

  // 営業時間の範囲内の時刻だけを選択肢にする（範囲外の登録ミスを防ぐ）
  const options = useMemo(() => {
    const all = generateTimeOptions();
    if (!range) return all;
    return all.filter((o) => {
      const m = timeToMinutes(o.value);
      return m >= range.min && m < range.max && !times.includes(o.value);
    });
  }, [range, times]);

  const sorted = useMemo(
    () => [...times].sort((a, b) => timeToMinutes(a) - timeToMinutes(b)),
    [times]
  );

  const totalOpenDays = useMemo(() => openDayCount(businessHours), [businessHours]);

  /** 表示する警告文。問題なければ null */
  const warningFor = (time: string): string | null => {
    const ngDays = outOfRangeDays(businessHours, time);
    if (ngDays.length === 0) return null;
    if (ngDays.length >= totalOpenDays) {
      return "営業時間外のため、お客様の画面には表示されません";
    }
    return `${ngDays.join("・")}曜は営業時間外のため、その曜日には表示されません`;
  };

  const handleAdd = () => {
    if (!pending || times.includes(pending)) return;
    onTimesChange([...times, pending]);
    setPending("");
  };

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm">
        予約できる開始時間
        <HelpTip>
          「1日◯枠だけ受け付けたい」「お昼休みは予約を入れたくない」という場合は「開始時間を指定する」を選んでください。指定した時間だけがお客様の画面に表示されます。
        </HelpTip>
      </h3>
      <p className="text-xs text-text-light">お客様が選べる予約の開始時間の決め方</p>

      <div className="space-y-1.5">
        <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/30 transition-colors cursor-pointer min-h-[48px]">
          <input
            type="radio"
            name="slotMode"
            checked={mode !== "fixed"}
            onChange={() => onModeChange("interval")}
            className="w-5 h-5 accent-accent"
          />
          <span className="text-sm">営業時間内から30分ごと（おまかせ）</span>
        </label>
        <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/30 transition-colors cursor-pointer min-h-[48px]">
          <input
            type="radio"
            name="slotMode"
            checked={mode === "fixed"}
            onChange={() => onModeChange("fixed")}
            className="w-5 h-5 accent-accent"
          />
          <span className="text-sm">開始時間を指定する</span>
        </label>
      </div>

      {mode === "fixed" && (
        <div className="bg-background rounded-xl p-3 space-y-3">
          {range && (
            <p className="text-xs text-text-light">
              現在の営業時間は {minutesToTime(range.min)}〜{minutesToTime(range.max)} です。
              <Link href="/settings/business-hours" className="text-accent hover:underline ml-1">
                営業時間を変更する
              </Link>
            </p>
          )}

          {sorted.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-6 text-center">
              <p className="text-text-light text-sm">開始時間はまだ登録されていません</p>
              <p className="text-text-light text-xs mt-1">
                1つも登録しないと、お客様は予約できません
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sorted.map((time) => (
                <li
                  key={time}
                  className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-sm font-medium">{time}</span>
                    {warningFor(time) && (
                      <p className="text-xs text-error mt-0.5">{warningFor(time)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onTimesChange(times.filter((t) => t !== time))}
                    className="text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px]"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <select
              value={pending}
              onChange={(e) => setPending(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors min-h-[48px]"
            >
              <option value="">時間を選ぶ</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!pending}
              className="bg-accent hover:bg-accent-light disabled:opacity-40 text-white text-sm font-medium rounded-xl px-4 min-h-[48px] transition-colors"
            >
              + 追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
