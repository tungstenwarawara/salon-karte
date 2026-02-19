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
  const parts = time.split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
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

/** Date → "YYYY-MM-DD"（ローカルタイムゾーン） */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 不定休かどうかを判定 */
export function isIrregularHoliday(
  holidays: string[] | null | undefined,
  date: Date | string
): boolean {
  if (!holidays || holidays.length === 0) return false;
  const d = toDate(date);
  return holidays.includes(toDateString(d));
}

/** 日付の曜日スケジュールを取得（不定休考慮） */
export function getScheduleForDate(
  businessHours: BusinessHours | null,
  date: Date | string,
  holidays?: string[] | null
): DaySchedule {
  const bh = businessHours ?? DEFAULT_BUSINESS_HOURS;
  const d = toDate(date);

  // 不定休チェック: holidays に含まれる日付は休業扱い
  if (holidays && holidays.length > 0) {
    const dateStr = toDateString(d);
    if (holidays.includes(dateStr)) {
      // 元の曜日スケジュールの時間は保持しつつ is_open を false に
      const dayKey = DAY_KEY_MAP[d.getDay()];
      const original = bh[dayKey];
      return { ...original, is_open: false };
    }
  }

  const dayKey = DAY_KEY_MAP[d.getDay()];
  return bh[dayKey];
}

/** 営業日かどうか（不定休考慮） */
export function isBusinessDay(
  businessHours: BusinessHours | null,
  date: Date | string,
  holidays?: string[] | null
): boolean {
  return getScheduleForDate(businessHours, date, holidays).is_open;
}

/** 時間帯が営業時間内かチェック（不定休考慮） */
export function isWithinBusinessHours(
  businessHours: BusinessHours | null,
  date: Date | string,
  startTime: string,
  endTime: string,
  holidays?: string[] | null
): boolean {
  const schedule = getScheduleForDate(businessHours, date, holidays);
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
