/**
 * Web予約用: 空き時間スロット計算ユーティリティ
 * time-slot-visualization.tsx のロジックをサーバーサイドで再利用可能な形に抽出
 */
import type { BusinessHours, BookingSettings, HourOverrides } from "@/types/database";
import {
  getScheduleForDate,
  timeToMinutes,
  minutesToTime,
  nowInJst,
  toDateString,
} from "@/lib/business-hours";

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
 * @param interval - スロット間隔（分）。デフォルト30。slot_mode = "fixed" のときは無視される
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

  // 現在時刻の判定はすべて JST 基準で行う（Vercel ランタイムは UTC のため）
  const jstNow = nowInJst();
  const todayStr = toDateString(jstNow);
  const nowMin = jstNow.getHours() * 60 + jstNow.getMinutes();

  // 当日予約の可否チェック
  if (bookingSettings?.same_day_enabled === false && date === todayStr) return [];

  // min_advance_hours: 予約受付締切（X時間前まで受付可能）
  // 例: min_advance_hours=2 → 現在時刻+2時間より前の枠はブロック（当日以外にも適用）
  const minAdvanceHours = bookingSettings?.min_advance_hours ?? 0;
  let advanceThresholdMin = -1;
  if (minAdvanceHours > 0) {
    const threshold = new Date(jstNow.getTime() + minAdvanceHours * 60 * 60 * 1000);
    const thresholdStr = toDateString(threshold);
    // 対象日が締切を完全に過ぎている場合は全スロット不可
    if (date < thresholdStr) return [];
    // 締切と同じ日のみスロット単位でブロック（date > thresholdStr なら制限なし）
    if (date === thresholdStr) {
      advanceThresholdMin = threshold.getHours() * 60 + threshold.getMinutes();
    }
  }

  // 当日は現在時刻を過ぎた枠を常にブロックし、lead_time_minutes はさらに手前で締め切る
  const leadMin = bookingSettings?.lead_time_minutes ?? 0;
  const leadTimeThreshold = date === todayStr ? nowMin + leadMin : -1;

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
  for (const m of resolveStartMinutes(bookingSettings, openMin, closeMin, interval)) {
    // 基本チェック: 同時予約上限に達しているか
    const isOccupied = countOverlapping(m) >= maxConcurrent;

    // リードタイム制限（当日の lead_time_minutes + 全日の min_advance_hours）
    const isBeforeLeadTime =
      (leadTimeThreshold >= 0 && m < leadTimeThreshold) ||
      (advanceThresholdMin >= 0 && m < advanceThresholdMin);

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

/**
 * 予約開始時刻の候補（0時からの分）を返す
 *
 * - slot_mode = "fixed": サロンが指定した時刻のうち、その日の営業時間内のものだけ
 *   （曜日ごとに営業時間が違うため、営業時間外になる時刻はその日だけ自動で除外される）
 * - それ以外（既定）: 営業時間を interval 刻み
 */
export function resolveStartMinutes(
  bookingSettings: BookingSettings | null,
  openMin: number,
  closeMin: number,
  interval: number
): number[] {
  if (bookingSettings?.slot_mode === "fixed") {
    const unique = Array.from(new Set(bookingSettings.slot_times ?? []));
    return unique
      .map(timeToMinutes)
      .filter((m) => m >= openMin && m < closeMin)
      .sort((a, b) => a - b);
  }

  const result: number[] = [];
  for (let m = openMin; m < closeMin; m += interval) result.push(m);
  return result;
}
