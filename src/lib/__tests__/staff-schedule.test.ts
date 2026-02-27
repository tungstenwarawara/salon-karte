import { describe, it, expect } from "vitest";
import {
  getStaffScheduleForDate,
  getStaffSchedulesForWeek,
  getWeekMonday,
} from "@/lib/staff-schedule";
import type { BusinessHours } from "@/types/database";
import type { StaffScheduleOverride } from "@/lib/staff-schedule";

// テスト用営業時間
const salonHours: BusinessHours = {
  monday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  tuesday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  wednesday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  thursday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  friday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  saturday: { is_open: true, open_time: "10:00", close_time: "20:00" },
  sunday: { is_open: false, open_time: "10:00", close_time: "20:00" },
};

// スタッフ個別スケジュール（水曜休み・土曜短縮）
const staffSchedule: BusinessHours = {
  monday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  tuesday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  wednesday: { is_open: false, open_time: "09:00", close_time: "18:00" },
  thursday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  friday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  saturday: { is_open: true, open_time: "10:00", close_time: "16:00" },
  sunday: { is_open: false, open_time: "10:00", close_time: "16:00" },
};

describe("getStaffScheduleForDate", () => {
  const staffId = "staff-1";

  it("override が最優先", () => {
    const overrides: StaffScheduleOverride[] = [
      { staff_id: staffId, override_date: "2025-01-13", is_working: false, start_time: null, end_time: null },
    ];
    const result = getStaffScheduleForDate("2025-01-13", staffSchedule, salonHours, null, overrides);
    expect(result.isWorking).toBe(false);
    expect(result.source).toBe("override");
  });

  it("override で出勤+カスタム時間", () => {
    const overrides: StaffScheduleOverride[] = [
      { staff_id: staffId, override_date: "2025-01-15", is_working: true, start_time: "11:00", end_time: "15:00" },
    ];
    // 2025-01-15 = 水曜（staffScheduleでは休み）
    const result = getStaffScheduleForDate("2025-01-15", staffSchedule, salonHours, null, overrides);
    expect(result.isWorking).toBe(true);
    expect(result.startTime).toBe("11:00");
    expect(result.endTime).toBe("15:00");
    expect(result.source).toBe("override");
  });

  it("override の時間が null の場合はスタッフデフォルトにフォールバック", () => {
    const overrides: StaffScheduleOverride[] = [
      { staff_id: staffId, override_date: "2025-01-13", is_working: true, start_time: null, end_time: null },
    ];
    const result = getStaffScheduleForDate("2025-01-13", staffSchedule, salonHours, null, overrides);
    expect(result.isWorking).toBe(true);
    expect(result.startTime).toBe("09:00"); // staffScheduleの月曜
    expect(result.endTime).toBe("18:00");
    expect(result.source).toBe("override");
  });

  it("override なし → staff default_schedule を使用", () => {
    const result = getStaffScheduleForDate("2025-01-13", staffSchedule, salonHours, null, []);
    expect(result.isWorking).toBe(true);
    expect(result.startTime).toBe("09:00");
    expect(result.endTime).toBe("18:00");
    expect(result.source).toBe("staff");
  });

  it("staff default_schedule が水曜休みなら休み", () => {
    const result = getStaffScheduleForDate("2025-01-15", staffSchedule, salonHours, null, []);
    expect(result.isWorking).toBe(false);
    expect(result.source).toBe("staff");
  });

  it("staff default_schedule なし → salon business_hours にフォールバック", () => {
    const result = getStaffScheduleForDate("2025-01-13", null, salonHours, null, []);
    expect(result.isWorking).toBe(true);
    expect(result.startTime).toBe("10:00");
    expect(result.endTime).toBe("20:00");
    expect(result.source).toBe("salon");
  });

  it("不定休はスタッフスケジュールでも適用", () => {
    const holidays = ["2025-01-13"]; // 月曜を不定休に
    const result = getStaffScheduleForDate("2025-01-13", staffSchedule, salonHours, holidays, []);
    expect(result.isWorking).toBe(false);
    expect(result.source).toBe("staff");
  });

  it("不定休はサロンフォールバック時も適用", () => {
    const holidays = ["2025-01-13"];
    const result = getStaffScheduleForDate("2025-01-13", null, salonHours, holidays, []);
    expect(result.isWorking).toBe(false);
    expect(result.source).toBe("salon");
  });
});

describe("getStaffSchedulesForWeek", () => {
  it("全スタッフ×7日分のスケジュールを生成", () => {
    const weekStart = new Date(2025, 0, 13); // 2025-01-13（月曜）
    const staffList = [
      { id: "s1", name: "田中", default_schedule: staffSchedule },
      { id: "s2", name: "佐藤", default_schedule: null },
    ];
    const result = getStaffSchedulesForWeek(weekStart, staffList, salonHours, null, []);

    expect(result).toHaveLength(2);
    expect(result[0].staffId).toBe("s1");
    expect(result[0].staffName).toBe("田中");
    expect(Object.keys(result[0].days)).toHaveLength(7);

    // 田中: 水曜は休み（staffSchedule）
    expect(result[0].days["2025-01-15"].isWorking).toBe(false);
    // 佐藤: 水曜は出勤（salonHoursフォールバック）
    expect(result[1].days["2025-01-15"].isWorking).toBe(true);
  });

  it("override が正しく適用される", () => {
    const weekStart = new Date(2025, 0, 13);
    const staffList = [{ id: "s1", name: "田中", default_schedule: staffSchedule }];
    const overrides: StaffScheduleOverride[] = [
      { staff_id: "s1", override_date: "2025-01-15", is_working: true, start_time: "12:00", end_time: "16:00" },
    ];
    const result = getStaffSchedulesForWeek(weekStart, staffList, salonHours, null, overrides);

    // 水曜がoverrideで出勤に
    expect(result[0].days["2025-01-15"].isWorking).toBe(true);
    expect(result[0].days["2025-01-15"].startTime).toBe("12:00");
    expect(result[0].days["2025-01-15"].source).toBe("override");
  });

  it("空のスタッフリストなら空配列", () => {
    const weekStart = new Date(2025, 0, 13);
    const result = getStaffSchedulesForWeek(weekStart, [], salonHours, null, []);
    expect(result).toHaveLength(0);
  });
});

describe("getWeekMonday", () => {
  it("月曜入力 → そのまま月曜", () => {
    const monday = getWeekMonday(new Date(2025, 0, 13)); // 月曜
    expect(monday.getFullYear()).toBe(2025);
    expect(monday.getMonth()).toBe(0);
    expect(monday.getDate()).toBe(13);
  });

  it("水曜入力 → 同じ週の月曜", () => {
    const monday = getWeekMonday(new Date(2025, 0, 15)); // 水曜
    expect(monday.getDate()).toBe(13);
  });

  it("日曜入力 → 前の月曜", () => {
    const monday = getWeekMonday(new Date(2025, 0, 19)); // 日曜
    expect(monday.getDate()).toBe(13);
  });

  it("土曜入力 → 同じ週の月曜", () => {
    const monday = getWeekMonday(new Date(2025, 0, 18)); // 土曜
    expect(monday.getDate()).toBe(13);
  });

  it("時間が0:0:0にリセットされる", () => {
    const monday = getWeekMonday(new Date(2025, 0, 15, 14, 30, 0));
    expect(monday.getHours()).toBe(0);
    expect(monday.getMinutes()).toBe(0);
    expect(monday.getSeconds()).toBe(0);
  });

  it("年をまたぐ場合（日曜が翌年の1月）", () => {
    // 2024-12-29 = 日曜 → 月曜は 2024-12-23
    const monday = getWeekMonday(new Date(2024, 11, 29));
    expect(monday.getFullYear()).toBe(2024);
    expect(monday.getMonth()).toBe(11);
    expect(monday.getDate()).toBe(23);
  });
});
