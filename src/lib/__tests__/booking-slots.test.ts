import { describe, it, expect, vi } from "vitest";
import { calculateAvailableSlots, resolveStartMinutes } from "@/lib/booking-slots";
import {
  nowInJst,
  toDateString,
  todayStrInJst,
  jstDateStringAfterDays,
} from "@/lib/business-hours";
import type { BusinessHours, BookingSettings } from "@/types/database";

/** 全曜日 10:00-15:00 営業 */
const HOURS_10_15: BusinessHours = {
  monday: { is_open: true, open_time: "10:00", close_time: "15:00" },
  tuesday: { is_open: true, open_time: "10:00", close_time: "15:00" },
  wednesday: { is_open: true, open_time: "10:00", close_time: "15:00" },
  thursday: { is_open: true, open_time: "10:00", close_time: "15:00" },
  friday: { is_open: true, open_time: "10:00", close_time: "15:00" },
  saturday: { is_open: true, open_time: "10:00", close_time: "15:00" },
  sunday: { is_open: true, open_time: "10:00", close_time: "15:00" },
};

const BASE_SETTINGS: BookingSettings = {
  same_day_enabled: true,
  lead_time_minutes: 0,
  max_concurrent_appointments: 1,
};

/** 締切・当日判定の影響を受けないよう、常に30日先の日付を使う */
function futureDate(): string {
  const d = nowInJst();
  d.setDate(d.getDate() + 30);
  return toDateString(d);
}

function slots(settings: BookingSettings, requestedDuration = 0, existing: { start_time: string; end_time: string | null }[] = []) {
  return calculateAvailableSlots({
    businessHours: HOURS_10_15,
    salonHolidays: null,
    bookingSettings: settings,
    date: futureDate(),
    existingAppointments: existing,
    requestedDuration,
  });
}

describe("resolveStartMinutes", () => {
  it("既定（interval）は営業時間を30分刻みにする", () => {
    expect(resolveStartMinutes(BASE_SETTINGS, 600, 900, 30)).toEqual([
      600, 630, 660, 690, 720, 750, 780, 810, 840, 870,
    ]);
  });

  it("fixed は指定した時刻だけを返す", () => {
    const settings: BookingSettings = { ...BASE_SETTINGS, slot_mode: "fixed", slot_times: ["13:00", "10:00"] };
    expect(resolveStartMinutes(settings, 600, 900, 30)).toEqual([600, 780]);
  });

  it("fixed で営業時間外の時刻は除外する", () => {
    const settings: BookingSettings = {
      ...BASE_SETTINGS,
      slot_mode: "fixed",
      slot_times: ["09:00", "10:00", "13:00", "15:00", "18:00"],
    };
    // 09:00 は開店前、15:00 と 18:00 は閉店以降なので除外
    expect(resolveStartMinutes(settings, 600, 900, 30)).toEqual([600, 780]);
  });

  it("fixed で重複した時刻は1つにまとめる", () => {
    const settings: BookingSettings = { ...BASE_SETTINGS, slot_mode: "fixed", slot_times: ["10:00", "10:00"] };
    expect(resolveStartMinutes(settings, 600, 900, 30)).toEqual([600]);
  });

  it("slot_times が空の fixed は候補ゼロ", () => {
    const settings: BookingSettings = { ...BASE_SETTINGS, slot_mode: "fixed", slot_times: [] };
    expect(resolveStartMinutes(settings, 600, 900, 30)).toEqual([]);
  });
});

describe("calculateAvailableSlots", () => {
  it("既定では10:00〜14:30の10枠を返す", () => {
    const result = slots(BASE_SETTINGS);
    expect(result.map((s) => s.time)).toEqual([
      "10:00", "10:30", "11:00", "11:30", "12:00",
      "12:30", "13:00", "13:30", "14:00", "14:30",
    ]);
    expect(result.every((s) => s.available)).toBe(true);
  });

  it("fixed 指定なら 10:00 と 13:00 の2枠だけになる", () => {
    const result = slots({ ...BASE_SETTINGS, slot_mode: "fixed", slot_times: ["10:00", "13:00"] });
    expect(result.map((s) => s.time)).toEqual(["10:00", "13:00"]);
    expect(result.every((s) => s.available)).toBe(true);
  });

  it("fixed でも所要時間が閉店をはみ出す枠は選べない", () => {
    // 13:00 開始で150分 → 15:30 となり閉店15:00を超える
    const result = slots({ ...BASE_SETTINGS, slot_mode: "fixed", slot_times: ["10:00", "13:00"] }, 150);
    expect(result.find((s) => s.time === "10:00")?.available).toBe(true);
    const at13 = result.find((s) => s.time === "13:00");
    expect(at13?.available).toBe(false);
    expect(at13?.reason).toBe("exceeds_close");
  });

  it("fixed でも既存予約と重なる枠は埋まり扱いになる", () => {
    const result = slots(
      { ...BASE_SETTINGS, slot_mode: "fixed", slot_times: ["10:00", "13:00"] },
      0,
      [{ start_time: "12:30:00", end_time: "14:00:00" }]
    );
    expect(result.find((s) => s.time === "10:00")?.available).toBe(true);
    const at13 = result.find((s) => s.time === "13:00");
    expect(at13?.available).toBe(false);
    expect(at13?.reason).toBe("occupied");
  });

  it("将来3枠に増やす場合も指定どおりに反映される", () => {
    const extended: BusinessHours = {
      ...HOURS_10_15,
      monday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      tuesday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      wednesday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      thursday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      friday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      saturday: { is_open: true, open_time: "10:00", close_time: "18:00" },
      sunday: { is_open: true, open_time: "10:00", close_time: "18:00" },
    };
    const result = calculateAvailableSlots({
      businessHours: extended,
      salonHolidays: null,
      bookingSettings: { ...BASE_SETTINGS, slot_mode: "fixed", slot_times: ["10:00", "13:00", "15:00"] },
      date: futureDate(),
      existingAppointments: [],
    });
    expect(result.map((s) => s.time)).toEqual(["10:00", "13:00", "15:00"]);
  });

  it("休業日は枠ゼロ", () => {
    const date = futureDate();
    const result = calculateAvailableSlots({
      businessHours: HOURS_10_15,
      salonHolidays: [date],
      bookingSettings: { ...BASE_SETTINGS, slot_mode: "fixed", slot_times: ["10:00", "13:00"] },
      date,
      existingAppointments: [],
    });
    expect(result).toEqual([]);
  });

  it("当日の過ぎた時刻は受付締切扱いになる（実行環境のTZに依存しない）", () => {
    // 2026-08-20 05:00 UTC = 同日 14:00 JST
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T05:00:00Z"));
    try {
      const result = calculateAvailableSlots({
        businessHours: HOURS_10_15,
        salonHolidays: null,
        bookingSettings: BASE_SETTINGS,
        date: "2026-08-20",
        existingAppointments: [],
      });
      const available = result.filter((s) => s.available).map((s) => s.time);
      // JST 14:00 時点なので 14:00 以降だけが残る
      expect(available).toEqual(["14:00", "14:30"]);
      expect(result.find((s) => s.time === "13:30")?.reason).toBe("lead_time");
    } finally {
      vi.useRealTimers();
    }
  });

  /**
   * 退行ガード: 予約APIの過去日ガードと calculateAvailableSlots の「今日」が
   * 同じJST基準であること。基準がズレると JST 00:00〜09:00 の間だけ
   * 「JSTの前日」が過去日ガードを素通りし、かつ当日ブロックも効かなくなる。
   */
  it("APIの過去日ガードとスロット計算の「今日」が一致する（JST 08:00 / UTCランタイム想定）", () => {
    vi.useFakeTimers();
    // 2026-08-11T23:00Z = JST 2026-08-12 08:00（UTCでは前日）
    vi.setSystemTime(new Date("2026-08-11T23:00:00Z"));
    try {
      // API側のガードが見る「今日」
      expect(todayStrInJst()).toBe("2026-08-12");

      // JSTの前日を要求した場合、スロット側でも当日扱いにならず全枠締切になること
      const result = calculateAvailableSlots({
        businessHours: HOURS_10_15,
        salonHolidays: null,
        bookingSettings: { ...BASE_SETTINGS, lead_time_minutes: 60 },
        date: "2026-08-11",
        existingAppointments: [],
      });
      // 過去日なので予約可能な枠が1つも無い（APIガードで弾く前提だが二重防御を確認）
      expect(result.filter((s) => s.available)).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("60日先の上限もJST基準で計算される", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-11T23:00:00Z")); // JST 2026-08-12
    try {
      expect(jstDateStringAfterDays(60)).toBe("2026-10-11");
    } finally {
      vi.useRealTimers();
    }
  });

  it("fixed でも当日の過ぎた枠は締切扱いになる", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T05:00:00Z")); // 14:00 JST
    try {
      const result = calculateAvailableSlots({
        businessHours: HOURS_10_15,
        salonHolidays: null,
        bookingSettings: { ...BASE_SETTINGS, slot_mode: "fixed", slot_times: ["10:00", "13:00"] },
        date: "2026-08-20",
        existingAppointments: [],
      });
      expect(result.map((s) => s.time)).toEqual(["10:00", "13:00"]);
      expect(result.every((s) => !s.available && s.reason === "lead_time")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
