import type { BusinessHours, DaySchedule } from "@/types/database";

/** JS Date.getDay() (0=Sun, 1=Mon, ...) → BusinessHours キー変換 */
export const DAY_KEY_MAP: Record<number, keyof BusinessHours> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

/** 日本語表示名 */
export const DAY_LABELS: Record<keyof BusinessHours, string> = {
  monday: "月曜日",
  tuesday: "火曜日",
  wednesday: "水曜日",
  thursday: "木曜日",
  friday: "金曜日",
  saturday: "土曜日",
  sunday: "日曜日",
};

/** 短縮名 */
export const DAY_SHORT_LABELS: Record<keyof BusinessHours, string> = {
  monday: "月",
  tuesday: "火",
  wednesday: "水",
  thursday: "木",
  friday: "金",
  saturday: "土",
  sunday: "日",
};

/** 月→日の順序配列 */
export const ORDERED_DAYS: (keyof BusinessHours)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** デフォルト営業時間（DB デフォルトと同一） */
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  tuesday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  wednesday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  thursday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  friday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  saturday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  sunday: { is_open: false, open_time: "10:00", close_time: "20:00" },
};

/** "HH:MM" → 分 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 分 → "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 日付文字列 or Date → JS Date */
function toDate(date: Date | string): Date {
  if (typeof date === "string") {
    // "YYYY-MM-DD" → ローカルタイムゾーンで解析
    const [y, mo, d] = date.split("-").map(Number);
    return new Date(y, mo - 1, d);
  }
  return date;
}

/** 日付の曜日スケジュールを取得 */
export function getScheduleForDate(
  businessHours: BusinessHours | null,
  date: Date | string
): DaySchedule {
  const bh = businessHours ?? DEFAULT_BUSINESS_HOURS;
  const d = toDate(date);
  const dayKey = DAY_KEY_MAP[d.getDay()];
  return bh[dayKey];
}

/** 営業日かどうか */
export function isBusinessDay(
  businessHours: BusinessHours | null,
  date: Date | string
): boolean {
  return getScheduleForDate(businessHours, date).is_open;
}

/** 時間帯が営業時間内かチェック */
export function isWithinBusinessHours(
  businessHours: BusinessHours | null,
  date: Date | string,
  startTime: string,
  endTime: string
): boolean {
  const schedule = getScheduleForDate(businessHours, date);
  if (!schedule.is_open) return false;
  const openMin = timeToMinutes(schedule.open_time);
  const closeMin = timeToMinutes(schedule.close_time);
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  return startMin >= openMin && endMin <= closeMin;
}

/** 15分刻みの時間選択肢を生成（00:00〜23:45） */
export function generateTimeOptions(): { value: string; label: string }[] {
  return Array.from({ length: 96 }, (_, i) => {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return { value, label: value };
  });
}
