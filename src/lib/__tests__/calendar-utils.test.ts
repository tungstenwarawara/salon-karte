import { describe, it, expect, vi, afterEach } from "vitest";
import { buildCalendar, WEEKDAY_HEADERS } from "@/lib/calendar-utils";
import { DEFAULT_BUSINESS_HOURS } from "@/lib/business-hours";
import type { BusinessHours } from "@/types/database";

describe("WEEKDAY_HEADERS", () => {
  it("月曜始まりの7曜日", () => {
    expect(WEEKDAY_HEADERS).toEqual(["月", "火", "水", "木", "金", "土", "日"]);
  });
});

describe("buildCalendar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("常に42日（6行×7列）を返す", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15));
    const days = buildCalendar(2025, 1, DEFAULT_BUSINESS_HOURS, new Set());
    expect(days).toHaveLength(42);
  });

  it("月曜始まり: 最初の日の曜日は月曜", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15));
    const days = buildCalendar(2025, 1, DEFAULT_BUSINESS_HOURS, new Set());
    // 2025年1月は水曜始まり → 前月の12/29(月)、12/30(火)が先に入る
    const firstDay = days[0].date;
    expect(firstDay.getDay()).toBe(1); // 月曜 = 1
  });

  it("当月フラグが正しい", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15));
    const days = buildCalendar(2025, 1, DEFAULT_BUSINESS_HOURS, new Set());
    // 当月の日は isCurrentMonth = true
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(31); // 1月は31日
    expect(currentMonthDays[0].day).toBe(1);
    expect(currentMonthDays[30].day).toBe(31);
  });

  it("前月・翌月の埋め合わせ日が含まれる", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15));
    const days = buildCalendar(2025, 1, DEFAULT_BUSINESS_HOURS, new Set());
    const nonCurrentMonth = days.filter((d) => !d.isCurrentMonth);
    expect(nonCurrentMonth.length).toBe(42 - 31); // 11日
  });

  it("定休日フラグ: デフォルトでは日曜がisWeeklyHoliday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15));
    const days = buildCalendar(2025, 1, DEFAULT_BUSINESS_HOURS, new Set());
    const sundayDays = days.filter((d) => d.date.getDay() === 0);
    sundayDays.forEach((d) => {
      expect(d.isWeeklyHoliday).toBe(true);
    });
  });

  it("不定休フラグ: holidays Setに含まれる日付がisIrregularHoliday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15));
    const holidays = new Set(["2025-01-10", "2025-01-20"]);
    const days = buildCalendar(2025, 1, DEFAULT_BUSINESS_HOURS, holidays);
    const jan10 = days.find((d) => d.dateStr === "2025-01-10");
    const jan20 = days.find((d) => d.dateStr === "2025-01-20");
    const jan15 = days.find((d) => d.dateStr === "2025-01-15");

    expect(jan10?.isIrregularHoliday).toBe(true);
    expect(jan20?.isIrregularHoliday).toBe(true);
    expect(jan15?.isIrregularHoliday).toBe(false);
  });

  it("isPastフラグ: 今日以前の日はtrue", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
    const days = buildCalendar(2025, 1, DEFAULT_BUSINESS_HOURS, new Set());
    const jan14 = days.find((d) => d.dateStr === "2025-01-14");
    const jan15 = days.find((d) => d.dateStr === "2025-01-15");
    const jan16 = days.find((d) => d.dateStr === "2025-01-16");

    expect(jan14?.isPast).toBe(true);
    // 今日は isPast = false（ toDateString(today) との < 比較）
    expect(jan15?.isPast).toBe(false);
    expect(jan16?.isPast).toBe(false);
  });

  it("dateStrがYYYY-MM-DD形式", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15));
    const days = buildCalendar(2025, 1, DEFAULT_BUSINESS_HOURS, new Set());
    days.forEach((d) => {
      expect(d.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("2月のカレンダー（28日の月）", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 1, 15));
    const days = buildCalendar(2025, 2, DEFAULT_BUSINESS_HOURS, new Set());
    expect(days).toHaveLength(42);
    const febDays = days.filter((d) => d.isCurrentMonth);
    expect(febDays).toHaveLength(28);
  });

  it("カスタム営業時間で水曜定休", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15));
    const customHours: BusinessHours = {
      ...DEFAULT_BUSINESS_HOURS,
      wednesday: { is_open: false, open_time: "10:00", close_time: "20:00" },
    };
    const days = buildCalendar(2025, 1, customHours, new Set());
    const wednesdays = days.filter((d) => d.date.getDay() === 3);
    wednesdays.forEach((d) => {
      expect(d.isWeeklyHoliday).toBe(true);
    });
  });
});
