import type { BusinessHours, DaySchedule } from "@/types/database";
import { DAY_KEY_MAP, DEFAULT_BUSINESS_HOURS, toDateString } from "@/lib/business-hours";

export type StaffScheduleOverride = {
  staff_id: string;
  override_date: string;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
};

export type ResolvedSchedule = {
  isWorking: boolean;
  startTime: string;
  endTime: string;
  source: "salon" | "staff" | "override";
};

/** 日付文字列 → Date */
function toDate(date: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

/**
 * 特定日のスタッフスケジュールを解決
 * 優先度: override → staff default_schedule → salon business_hours + holidays
 */
export function getStaffScheduleForDate(
  dateStr: string,
  staffDefaultSchedule: BusinessHours | null,
  salonBusinessHours: BusinessHours | null,
  salonHolidays: string[] | null,
  overrides: StaffScheduleOverride[]
): ResolvedSchedule {
  const bh = salonBusinessHours ?? DEFAULT_BUSINESS_HOURS;
  const date = toDate(dateStr);
  const dayKey = DAY_KEY_MAP[date.getDay()];

  // 1. override チェック
  const override = overrides.find((o) => o.override_date === dateStr);
  if (override) {
    const fallbackSchedule = staffDefaultSchedule?.[dayKey] ?? bh[dayKey];
    return {
      isWorking: override.is_working,
      startTime: override.start_time ?? fallbackSchedule.open_time,
      endTime: override.end_time ?? fallbackSchedule.close_time,
      source: "override",
    };
  }

  // 2. staff default_schedule チェック
  if (staffDefaultSchedule) {
    const staffDay = staffDefaultSchedule[dayKey];
    // 不定休チェック（スタッフ個別スケジュールでも不定休は適用）
    const isHoliday = salonHolidays?.includes(dateStr) ?? false;
    return {
      isWorking: isHoliday ? false : staffDay.is_open,
      startTime: staffDay.open_time,
      endTime: staffDay.close_time,
      source: "staff",
    };
  }

  // 3. salon business_hours + holidays フォールバック
  const salonDay: DaySchedule = bh[dayKey];
  const isHoliday = salonHolidays?.includes(dateStr) ?? false;
  return {
    isWorking: isHoliday ? false : salonDay.is_open,
    startTime: salonDay.open_time,
    endTime: salonDay.close_time,
    source: "salon",
  };
}

type StaffInfo = {
  id: string;
  name: string;
  default_schedule: BusinessHours | null;
};

export type WeeklyStaffSchedule = {
  staffId: string;
  staffName: string;
  days: Record<string, ResolvedSchedule>;
};

/**
 * 全スタッフ × 7日分のスケジュールを一括生成（週間グリッド用）
 */
export function getStaffSchedulesForWeek(
  weekStartDate: Date,
  staffList: StaffInfo[],
  salonBusinessHours: BusinessHours | null,
  salonHolidays: string[] | null,
  overrides: StaffScheduleOverride[]
): WeeklyStaffSchedule[] {
  // 7日分の日付を生成
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    dates.push(toDateString(d));
  }

  return staffList.map((staff) => {
    const staffOverrides = overrides.filter(
      (o) => o.staff_id === staff.id && dates.includes(o.override_date)
    );
    const days: Record<string, ResolvedSchedule> = {};
    for (const dateStr of dates) {
      days[dateStr] = getStaffScheduleForDate(
        dateStr,
        staff.default_schedule,
        salonBusinessHours,
        salonHolidays,
        staffOverrides
      );
    }
    return { staffId: staff.id, staffName: staff.name, days };
  });
}

/** 週の月曜日を取得 */
export function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 日曜なら-6、それ以外は1-day
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
