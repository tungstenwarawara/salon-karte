import type { BusinessHours } from "@/types/database";
import { DAY_KEY_MAP, DEFAULT_BUSINESS_HOURS, toDateString } from "@/lib/business-hours";

/** カレンダー用の日付情報 */
export type CalendarDay = {
  date: Date;
  dateStr: string; // "YYYY-MM-DD"
  day: number; // 1-31
  isCurrentMonth: boolean;
  isPast: boolean;
  isWeeklyHoliday: boolean; // 曜日設定で定休日
  isIrregularHoliday: boolean; // 不定休設定済み
};

/** 曜日ヘッダー（月曜始まり） */
export const WEEKDAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"];

/** 指定月のカレンダー日付配列を生成（月曜始まり、6行=42日） */
export function buildCalendar(year: number, month: number, businessHours: BusinessHours, holidays: Set<string>): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);
  const bh = businessHours ?? DEFAULT_BUSINESS_HOURS;

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // 月曜始まり: 0=月 ... 6=日
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const makeCd = (d: Date, isCurrentMonth: boolean): CalendarDay => {
    const dateStr = toDateString(d);
    const dayKey = DAY_KEY_MAP[d.getDay()];
    return {
      date: d, dateStr, day: d.getDate(), isCurrentMonth,
      isPast: dateStr < todayStr,
      isWeeklyHoliday: !bh[dayKey].is_open,
      isIrregularHoliday: holidays.has(dateStr),
    };
  };

  const days: CalendarDay[] = [];

  // 前月の埋め合わせ
  for (let i = startDow - 1; i >= 0; i--) days.push(makeCd(new Date(year, month - 1, -i), false));
  // 当月
  for (let day = 1; day <= lastDay.getDate(); day++) days.push(makeCd(new Date(year, month - 1, day), true));
  // 次月の埋め合わせ（42日まで）
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) days.push(makeCd(new Date(year, month, i), false));

  return days;
}
