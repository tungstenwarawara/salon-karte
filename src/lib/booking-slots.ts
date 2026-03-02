/**
 * Web予約用: 空き時間スロット計算ユーティリティ
 * time-slot-visualization.tsx のロジックをサーバーサイドで再利用可能な形に抽出
 */
import type { BusinessHours, BookingSettings, HourOverrides } from "@/types/database";
import { getScheduleForDate, timeToMinutes, minutesToTime } from "@/lib/business-hours";

export type SlotUnavailableReason = "occupied" | "lead_time" | "exceeds_close" | "overlap_during";

export type SlotInfo = {
  time: string;       // "HH:MM"
  available: boolean;
  reason?: SlotUnavailableReason;
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
  hourOverrides,
  date,
  existingAppointments,
  requestedDuration = 0,
  interval = 30,
}: {
  businessHours: BusinessHours | null;
  salonHolidays: string[] | null;
  bookingSettings: BookingSettings | null;
  hourOverrides?: HourOverrides | null;
  date: string;
  existingAppointments: ExistingAppointment[];
  requestedDuration?: number;
  interval?: number;
}): SlotInfo[] {
  const schedule = getScheduleForDate(businessHours, date, salonHolidays, hourOverrides);
  if (!schedule.is_open) return [];

  const openMin = timeToMinutes(schedule.open_time);
  const closeMin = timeToMinutes(schedule.close_time);
  if (closeMin <= openMin) return [];

  const maxConcurrent = bookingSettings?.max_concurrent_appointments ?? 1;

  // min_advance_hours: 予約受付締切（X時間前まで受付可能）
  // 例: min_advance_hours=2 → 予約の2時間前を過ぎたスロットはブロック
  const minAdvanceHours = bookingSettings?.min_advance_hours ?? 0;
  let advanceThresholdMin = -1;
  if (minAdvanceHours > 0) {
    const now = new Date();
    const nowMs = now.getTime();
    const [y, mo, d] = date.split("-").map(Number);
    // 対象日のスロット時刻をJSTとして、現在時刻 + X時間 より前のスロットをブロック
    // nowMs + advanceHours の時刻を対象日の分に変換
    const slotDateStart = new Date(y, mo - 1, d, 0, 0, 0).getTime();
    const thresholdMs = nowMs + minAdvanceHours * 60 * 60 * 1000;
    // 閾値が対象日の範囲内の場合のみ適用
    if (thresholdMs > slotDateStart) {
      const thresholdDate = new Date(thresholdMs);
      // 対象日と同じ日の場合のみスロット単位でブロック
      const thresholdDateStr = `${thresholdDate.getFullYear()}-${String(thresholdDate.getMonth() + 1).padStart(2, "0")}-${String(thresholdDate.getDate()).padStart(2, "0")}`;
      if (thresholdDateStr === date) {
        advanceThresholdMin = thresholdDate.getHours() * 60 + thresholdDate.getMinutes();
      } else if (thresholdMs > slotDateStart + 24 * 60 * 60 * 1000) {
        // 閾値が対象日を完全に過ぎている場合、全スロット不可
        return [];
      }
    }
  }

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

    // リードタイム制限（当日の lead_time_minutes + 全日の min_advance_hours）
    const isBeforeLeadTime =
      (leadTimeThreshold > 0 && m < leadTimeThreshold) ||
      (advanceThresholdMin > 0 && m < advanceThresholdMin);

    // 施術時間が閉店までに収まるか + 途中に埋まった枠がないか
    let canFit = true;
    let fitReason: SlotUnavailableReason | undefined;
    if (!isOccupied && !isBeforeLeadTime && requestedDuration > 0) {
      if (m + requestedDuration > closeMin) {
        canFit = false;
        fitReason = "exceeds_close";
      } else {
        // 施術時間内の全15分刻みで重複チェック
        for (let checkMin = m; checkMin < m + requestedDuration; checkMin += 15) {
          if (countOverlapping(checkMin) >= maxConcurrent) {
            canFit = false;
            fitReason = "overlap_during";
            break;
          }
        }
      }
    }

    const available = !isOccupied && !isBeforeLeadTime && canFit;
    const reason: SlotUnavailableReason | undefined = !available
      ? (isOccupied ? "occupied" : isBeforeLeadTime ? "lead_time" : fitReason)
      : undefined;

    slots.push({ time: minutesToTime(m), available, reason });
  }

  return slots;
}
