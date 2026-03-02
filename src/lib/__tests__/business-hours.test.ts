import { describe, it, expect } from "vitest";
import {
  timeToMinutes,
  minutesToTime,
  toDateString,
  isIrregularHoliday,
  hasHourOverride,
  getScheduleForDate,
  isBusinessDay,
  isWithinBusinessHours,
  generateTimeOptions,
  DEFAULT_BUSINESS_HOURS,
} from "@/lib/business-hours";
import type { BusinessHours, HourOverrides } from "@/types/database";

// テスト用カスタム営業時間
const customHours: BusinessHours = {
  monday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  tuesday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  wednesday: { is_open: false, open_time: "09:00", close_time: "18:00" },
  thursday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  friday: { is_open: true, open_time: "09:00", close_time: "18:00" },
  saturday: { is_open: true, open_time: "10:00", close_time: "17:00" },
  sunday: { is_open: false, open_time: "10:00", close_time: "17:00" },
};

describe("timeToMinutes", () => {
  it("通常の時間を分に変換", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("10:00")).toBe(600);
    expect(timeToMinutes("20:00")).toBe(1200);
  });

  it("境界値: 0:00 と 23:59", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("不正な入力はゼロにフォールバック", () => {
    expect(timeToMinutes("abc:def")).toBe(0);
    expect(timeToMinutes("")).toBe(0);
  });
});

describe("minutesToTime", () => {
  it("分を時間文字列に変換", () => {
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(600)).toBe("10:00");
    expect(minutesToTime(1200)).toBe("20:00");
  });

  it("境界値", () => {
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(1439)).toBe("23:59");
  });
});

describe("toDateString", () => {
  it("DateをYYYY-MM-DD形式に変換", () => {
    expect(toDateString(new Date(2025, 0, 15))).toBe("2025-01-15");
    expect(toDateString(new Date(2025, 11, 31))).toBe("2025-12-31");
  });

  it("1桁の月・日もゼロパディング", () => {
    expect(toDateString(new Date(2025, 0, 5))).toBe("2025-01-05");
    expect(toDateString(new Date(2025, 2, 3))).toBe("2025-03-03");
  });
});

describe("isIrregularHoliday", () => {
  it("holidays配列に含まれる日付はtrue", () => {
    const holidays = ["2025-01-01", "2025-01-02", "2025-01-03"];
    expect(isIrregularHoliday(holidays, "2025-01-01")).toBe(true);
    expect(isIrregularHoliday(holidays, "2025-01-03")).toBe(true);
  });

  it("holidays配列に含まれない日付はfalse", () => {
    const holidays = ["2025-01-01"];
    expect(isIrregularHoliday(holidays, "2025-01-02")).toBe(false);
  });

  it("holidays が null/undefined/空 の場合はfalse", () => {
    expect(isIrregularHoliday(null, "2025-01-01")).toBe(false);
    expect(isIrregularHoliday(undefined, "2025-01-01")).toBe(false);
    expect(isIrregularHoliday([], "2025-01-01")).toBe(false);
  });

  it("Date型でも判定可能", () => {
    const holidays = ["2025-01-15"];
    expect(isIrregularHoliday(holidays, new Date(2025, 0, 15))).toBe(true);
  });
});

describe("getScheduleForDate", () => {
  it("通常営業日のスケジュールを返す", () => {
    // 2025-01-13 = 月曜日
    const schedule = getScheduleForDate(customHours, "2025-01-13");
    expect(schedule.is_open).toBe(true);
    expect(schedule.open_time).toBe("09:00");
    expect(schedule.close_time).toBe("18:00");
  });

  it("定休日のスケジュールを返す", () => {
    // 2025-01-15 = 水曜日（customHoursでは定休）
    const schedule = getScheduleForDate(customHours, "2025-01-15");
    expect(schedule.is_open).toBe(false);
  });

  it("不定休の場合、is_openをfalseにしつつ時間は保持", () => {
    const holidays = ["2025-01-13"]; // 月曜を不定休に
    const schedule = getScheduleForDate(customHours, "2025-01-13", holidays);
    expect(schedule.is_open).toBe(false);
    expect(schedule.open_time).toBe("09:00"); // 元の時間を保持
    expect(schedule.close_time).toBe("18:00");
  });

  it("businessHours が null の場合はデフォルトを使用", () => {
    // 2025-01-13 = 月曜日
    const schedule = getScheduleForDate(null, "2025-01-13");
    expect(schedule.is_open).toBe(true);
    expect(schedule.open_time).toBe("10:00");
    expect(schedule.close_time).toBe("20:00");
  });

  it("デフォルトの日曜日は定休", () => {
    // 2025-01-19 = 日曜日
    const schedule = getScheduleForDate(null, "2025-01-19");
    expect(schedule.is_open).toBe(false);
  });
});

describe("isBusinessDay", () => {
  it("営業日はtrue", () => {
    expect(isBusinessDay(customHours, "2025-01-13")).toBe(true); // 月曜
  });

  it("定休日はfalse", () => {
    expect(isBusinessDay(customHours, "2025-01-15")).toBe(false); // 水曜
    expect(isBusinessDay(customHours, "2025-01-19")).toBe(false); // 日曜
  });

  it("不定休はfalse", () => {
    const holidays = ["2025-01-13"];
    expect(isBusinessDay(customHours, "2025-01-13", holidays)).toBe(false);
  });
});

describe("isWithinBusinessHours", () => {
  it("営業時間内はtrue", () => {
    expect(isWithinBusinessHours(customHours, "2025-01-13", "09:00", "18:00")).toBe(true);
    expect(isWithinBusinessHours(customHours, "2025-01-13", "10:00", "12:00")).toBe(true);
  });

  it("営業時間外はfalse（開始が早い）", () => {
    expect(isWithinBusinessHours(customHours, "2025-01-13", "08:00", "12:00")).toBe(false);
  });

  it("営業時間外はfalse（終了が遅い）", () => {
    expect(isWithinBusinessHours(customHours, "2025-01-13", "10:00", "19:00")).toBe(false);
  });

  it("定休日はfalse（時間が営業時間内でも）", () => {
    expect(isWithinBusinessHours(customHours, "2025-01-15", "10:00", "12:00")).toBe(false);
  });

  it("不定休はfalse", () => {
    const holidays = ["2025-01-13"];
    expect(isWithinBusinessHours(customHours, "2025-01-13", "10:00", "12:00", holidays)).toBe(false);
  });

  it("境界値: ちょうど営業開始〜終了", () => {
    expect(isWithinBusinessHours(customHours, "2025-01-13", "09:00", "18:00")).toBe(true);
  });
});

// テスト用営業時間上書き
const overrides: HourOverrides = {
  "2025-01-13": { is_open: true, open_time: "09:00", close_time: "15:00" }, // 月曜を時短
  "2025-01-19": { is_open: true, open_time: "10:00", close_time: "14:00" }, // 日曜（定休日）を臨時営業
};

describe("hasHourOverride", () => {
  it("上書きがある日付はtrue", () => {
    expect(hasHourOverride(overrides, "2025-01-13")).toBe(true);
  });

  it("上書きがない日付はfalse", () => {
    expect(hasHourOverride(overrides, "2025-01-14")).toBe(false);
  });

  it("null/undefinedはfalse", () => {
    expect(hasHourOverride(null, "2025-01-13")).toBe(false);
    expect(hasHourOverride(undefined, "2025-01-13")).toBe(false);
  });
});

describe("getScheduleForDate（営業時間上書き）", () => {
  it("上書きがある日は上書きスケジュールを返す", () => {
    const schedule = getScheduleForDate(customHours, "2025-01-13", null, overrides);
    expect(schedule.is_open).toBe(true);
    expect(schedule.open_time).toBe("09:00");
    expect(schedule.close_time).toBe("15:00"); // 通常18:00 → 15:00に時短
  });

  it("定休日でも上書きがあれば営業扱い", () => {
    // 2025-01-19 = 日曜（customHoursでは定休）
    const schedule = getScheduleForDate(customHours, "2025-01-19", null, overrides);
    expect(schedule.is_open).toBe(true);
    expect(schedule.close_time).toBe("14:00");
  });

  it("上書きは不定休より優先される", () => {
    const holidays = ["2025-01-13"]; // 不定休に設定
    // 上書きもある → 上書きが優先
    const schedule = getScheduleForDate(customHours, "2025-01-13", holidays, overrides);
    expect(schedule.is_open).toBe(true);
    expect(schedule.close_time).toBe("15:00");
  });

  it("上書きがない日は通常通り", () => {
    const schedule = getScheduleForDate(customHours, "2025-01-14", null, overrides);
    expect(schedule.is_open).toBe(true);
    expect(schedule.open_time).toBe("09:00");
    expect(schedule.close_time).toBe("18:00"); // 火曜の通常時間
  });
});

describe("isBusinessDay（営業時間上書き）", () => {
  it("定休日でも上書きで営業日にできる", () => {
    expect(isBusinessDay(customHours, "2025-01-19", null, overrides)).toBe(true);
  });

  it("上書きでis_open=falseにすれば休業", () => {
    const closedOverride: HourOverrides = {
      "2025-01-13": { is_open: false, open_time: "09:00", close_time: "18:00" },
    };
    expect(isBusinessDay(customHours, "2025-01-13", null, closedOverride)).toBe(false);
  });
});

describe("isWithinBusinessHours（営業時間上書き）", () => {
  it("上書き時間内はtrue", () => {
    expect(isWithinBusinessHours(customHours, "2025-01-13", "09:00", "15:00", null, overrides)).toBe(true);
  });

  it("上書き時間外はfalse", () => {
    // 通常は18:00まで営業だが上書きで15:00閉店
    expect(isWithinBusinessHours(customHours, "2025-01-13", "09:00", "16:00", null, overrides)).toBe(false);
  });
});

describe("generateTimeOptions", () => {
  it("96個の15分刻み選択肢を生成", () => {
    const options = generateTimeOptions();
    expect(options).toHaveLength(96);
  });

  it("最初は00:00、最後は23:45", () => {
    const options = generateTimeOptions();
    expect(options[0]).toEqual({ value: "00:00", label: "00:00" });
    expect(options[95]).toEqual({ value: "23:45", label: "23:45" });
  });

  it("15分刻みで増加", () => {
    const options = generateTimeOptions();
    expect(options[1].value).toBe("00:15");
    expect(options[2].value).toBe("00:30");
    expect(options[3].value).toBe("00:45");
    expect(options[4].value).toBe("01:00");
  });
});
