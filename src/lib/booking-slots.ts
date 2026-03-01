/**
 * Web予約用: 空き時間スロット計算ユーティリティ
 * time-slot-visualization.tsx のロジックをサーバーサイドで再利用可能な形に抽出
 */
import type { BusinessHours, BookingSettings } from "@/types/database";
import { getScheduleForDate, timeToMinutes, minutesToTime } from "@/lib/business-hours";

export type SlotInfo = {
  time: string;       // "HH:MM"
  available: boolean;
};

type ExistingAppointment = {
  start_time: string;
  end_time: string | null;
};

/**
 * 指定日の空き時間スロットを計算する
 *
 * @param businessHours - サロンの営業時間設定
 * @param salonHolidays - 不定休リスト
 * @param bookingSettings - 予約受付設定（当日予約・リードタイム・同時予約上限）
 * @param date - 対象日 "YYYY-MM-DD"
 * @param existingAppointments - 対象日の既存予約（cancelledを除く）
 * @param requestedDuration - リクエストされた施術時間（分）。0の場合はスロット単体の空き判定
 * @param interval - スロット間隔（分）。デフォルト30
 */
export function calculateAvailableSlots({
  businessHours,
  salonHolidays,
  bookingSettings,
  date,
  existingAppointments,
  requestedDuration = 0,
  interval = 30,
}: {
  businessHours: BusinessHours | null;
  salonHolidays: string[] | null;
  bookingSettings: BookingSettings | null;
  date: string;
  existingAppointments: ExistingAppointment[];
  requestedDuration?: number;
  interval?: number;
}): SlotInfo[] {
  const schedule = getScheduleForDate(businessHours, date, salonHolidays);
  if (!schedule.is_open) return [];

  const openMin = timeToMinutes(schedule.open_time);
  const closeMin = timeToMinutes(schedule.close_time);
  if (closeMin <= openMin) return [];

  const maxConcurrent = bookingSettings?.max_concurrent_appointments ?? 1;

  // リードタイム制限: 当日のみ、現在時刻+lead_time_minutes より前のスロットをブロック
  const leadMin = bookingSettings?.lead_time_minutes ?? 0;
  let leadTimeThreshold = -1;
  if (leadMin > 0) {
    const now = new Date();
    // JST でローカル日付を比較
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (date === todayStr) {
      leadTimeThreshold = now.getHours() * 60 + now.getMinutes() + leadMin;
    }
  }

  // 当日予約の可否チェック
  if (bookingSettings?.same_day_enabled === false) {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (date === todayStr) return [];
  }

  // あるスロットに重複する予約数を返す
  const countOverlapping = (slotMin: number): number => {
    return existingAppointments.filter((apt) => {
      const aStart = timeToMinutes(apt.start_time.slice(0, 5));
      const aEnd = apt.end_time ? timeToMinutes(apt.end_time.slice(0, 5)) : aStart + 60;
      return slotMin >= aStart && slotMin < aEnd;
    }).length;
  };

  // スロット生成
  const slots: SlotInfo[] = [];
  for (let m = openMin; m < closeMin; m += interval) {
    // 基本チェック: 同時予約上限に達しているか
    const isOccupied = countOverlapping(m) >= maxConcurrent;

    // リードタイム制限
    const isBeforeLeadTime = leadTimeThreshold > 0 && m < leadTimeThreshold;

    // 施術時間が閉店までに収まるか + 途中に埋まった枠がないか
    let canFit = true;
    if (!isOccupied && !isBeforeLeadTime && requestedDuration > 0) {
      if (m + requestedDuration > closeMin) {
        canFit = false;
      } else {
        // 施術時間内の全15分刻みで重複チェック
        for (let checkMin = m; checkMin < m + requestedDuration; checkMin += 15) {
          if (countOverlapping(checkMin) >= maxConcurrent) {
            canFit = false;
            break;
          }
        }
      }
    }

    slots.push({
      time: minutesToTime(m),
      available: !isOccupied && !isBeforeLeadTime && canFit,
    });
  }

  return slots;
}
