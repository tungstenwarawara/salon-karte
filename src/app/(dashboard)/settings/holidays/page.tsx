"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { BusinessHours } from "@/types/database";
import {
  DAY_KEY_MAP,
  DAY_SHORT_LABELS,
  DEFAULT_BUSINESS_HOURS,
  toDateString,
} from "@/lib/business-hours";

/** カレンダー用の日付情報 */
type CalendarDay = {
  date: Date;
  dateStr: string; // "YYYY-MM-DD"
  day: number; // 1-31
  isCurrentMonth: boolean;
  isPast: boolean;
  isWeeklyHoliday: boolean; // 曜日設定で定休日
  isIrregularHoliday: boolean; // 不定休設定済み
};

/** 指定月のカレンダー日付配列を生成（月曜始まり） */
function buildCalendar(year: number, month: number, businessHours: BusinessHours, holidays: Set<string>): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // 月曜始まり: 0=月 ... 6=日
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: CalendarDay[] = [];

  // 前月の埋め合わせ
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i);
    const dateStr = toDateString(d);
    const dayKey = DAY_KEY_MAP[d.getDay()];
    const bh = businessHours ?? DEFAULT_BUSINESS_HOURS;
    days.push({
      date: d,
      dateStr,
      day: d.getDate(),
      isCurrentMonth: false,
      isPast: dateStr < todayStr,
      isWeeklyHoliday: !bh[dayKey].is_open,
      isIrregularHoliday: holidays.has(dateStr),
    });
  }

  // 当月
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month - 1, day);
    const dateStr = toDateString(d);
    const dayKey = DAY_KEY_MAP[d.getDay()];
    const bh = businessHours ?? DEFAULT_BUSINESS_HOURS;
    days.push({
      date: d,
      dateStr,
      day,
      isCurrentMonth: true,
      isPast: dateStr < todayStr,
      isWeeklyHoliday: !bh[dayKey].is_open,
      isIrregularHoliday: holidays.has(dateStr),
    });
  }

  // 次月の埋め合わせ（6行=42日まで）
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month, i);
    const dateStr = toDateString(d);
    const dayKey = DAY_KEY_MAP[d.getDay()];
    const bh = businessHours ?? DEFAULT_BUSINESS_HOURS;
    days.push({
      date: d,
      dateStr,
      day: d.getDate(),
      isCurrentMonth: false,
      isPast: dateStr < todayStr,
      isWeeklyHoliday: !bh[dayKey].is_open,
      isIrregularHoliday: holidays.has(dateStr),
    });
  }

  return days;
}

// 曜日ヘッダー（月曜始まり）
const WEEKDAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"];

export default function HolidaysPage() {
  const [salonId, setSalonId] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [originalHolidays, setOriginalHolidays] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // 表示月
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: salon } = await supabase
        .from("salons")
        .select("id, business_hours, salon_holidays")
        .eq("owner_id", user.id)
        .single<{
          id: string;
          business_hours: BusinessHours | null;
          salon_holidays: string[] | null;
        }>();

      if (salon) {
        setSalonId(salon.id);
        if (salon.business_hours) {
          setBusinessHours(salon.business_hours);
        }
        const h = new Set(salon.salon_holidays ?? []);
        setHolidays(h);
        setOriginalHolidays(new Set(h));
      }
      setLoaded(true);
    };
    load();
  }, []);

  const toggleHoliday = useCallback((dateStr: string) => {
    setHolidays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  }, []);

  const hasChanges = (() => {
    if (holidays.size !== originalHolidays.size) return true;
    for (const d of holidays) {
      if (!originalHolidays.has(d)) return true;
    }
    return false;
  })();

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const sorted = Array.from(holidays).sort();

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("salons")
      .update({ salon_holidays: sorted })
      .eq("id", salonId);

    if (updateError) {
      setError("保存に失敗しました");
      setSaving(false);
      return;
    }

    setOriginalHolidays(new Set(holidays));
    showToast("不定休を保存しました");
    setSaving(false);
  };

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const calendarDays = buildCalendar(viewYear, viewMonth, businessHours, holidays);

  // 当月の不定休数
  const monthHolidayCount = calendarDays.filter(
    (d) => d.isCurrentMonth && d.isIrregularHoliday
  ).length;

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      <PageHeader
        title="不定休設定"
        backLabel="設定"
        backHref="/settings"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "不定休設定" },
        ]}
      />

      <p className="text-sm text-text-light">
        カレンダーの日付をタップして臨時休業日を設定できます。
        曜日ごとの定休日は
        <a href="/settings/business-hours" className="text-accent hover:underline">
          営業時間設定
        </a>
        で変更できます。
      </p>

      {error && <ErrorAlert message={error} />}

      {/* カレンダー */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        {/* 月ナビ */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <h3 className="font-bold text-lg">
            {viewYear}年{viewMonth}月
          </h3>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_HEADERS.map((label, i) => (
            <div
              key={label}
              className={`text-xs font-medium py-1 ${
                i === 5
                  ? "text-blue-500"
                  : i === 6
                    ? "text-error"
                    : "text-text-light"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cd) => {
            const isDisabled = !cd.isCurrentMonth || cd.isPast || cd.isWeeklyHoliday;
            const canToggle = cd.isCurrentMonth && !cd.isPast && !cd.isWeeklyHoliday;

            return (
              <button
                key={cd.dateStr}
                type="button"
                disabled={isDisabled && !cd.isIrregularHoliday}
                onClick={() => {
                  if (canToggle) {
                    toggleHoliday(cd.dateStr);
                  } else if (cd.isIrregularHoliday && cd.isCurrentMonth) {
                    // 過去の不定休も解除可能に
                    toggleHoliday(cd.dateStr);
                  }
                }}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors min-h-[40px]
                  ${!cd.isCurrentMonth ? "opacity-30" : ""}
                  ${cd.isPast && cd.isCurrentMonth && !cd.isIrregularHoliday ? "opacity-40" : ""}
                  ${
                    cd.isIrregularHoliday && cd.isCurrentMonth
                      ? "bg-error/15 border-2 border-error/40 text-error font-bold"
                      : cd.isWeeklyHoliday && cd.isCurrentMonth
                        ? "bg-border/50 text-text-light"
                        : canToggle
                          ? "hover:bg-accent/10 active:bg-accent/20"
                          : ""
                  }
                `}
              >
                <span className="text-sm">{cd.day}</span>
                {cd.isWeeklyHoliday && cd.isCurrentMonth && !cd.isIrregularHoliday && (
                  <span className="text-[9px] leading-none text-text-light">
                    定休
                  </span>
                )}
                {cd.isIrregularHoliday && cd.isCurrentMonth && (
                  <span className="text-[9px] leading-none text-error font-bold">
                    休み
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 凡例 */}
        <div className="flex gap-4 text-xs text-text-light pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-border/50" />
            <span>定休日</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-error/15 border border-error/40" />
            <span>不定休</span>
          </div>
        </div>
      </div>

      {/* サマリー */}
      {monthHolidayCount > 0 && (
        <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 text-sm">
          <span className="font-medium text-error">
            {viewMonth}月の臨時休業: {monthHolidayCount}日
          </span>
          <div className="mt-1 text-text-light">
            {calendarDays
              .filter((d) => d.isCurrentMonth && d.isIrregularHoliday)
              .map((d) => {
                const dayKey = DAY_KEY_MAP[d.date.getDay()];
                return `${d.day}日(${DAY_SHORT_LABELS[dayKey]})`;
              })
              .join("、")}
          </div>
        </div>
      )}

      {/* 保存ボタン */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
      >
        {saving ? "保存中..." : hasChanges ? "保存する" : "変更なし"}
      </button>
    </div>
  );
}
