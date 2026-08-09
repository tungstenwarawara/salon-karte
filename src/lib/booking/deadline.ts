import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingSettings } from "@/types/database";
import { nowInJst } from "@/lib/business-hours";

/**
 * キャンセル・変更の締切チェック
 * 締切を過ぎている場合はエラーメッセージを返す。問題なければ null を返す。
 */
export async function checkChangeDeadline(
  admin: SupabaseClient,
  salonId: string,
  appointmentDate: string,
  startTime: string
): Promise<string | null> {
  const { data: salon } = await admin
    .from("salons")
    .select("booking_settings")
    .eq("id", salonId)
    .single<{ booking_settings: BookingSettings | null }>();

  const deadlineHours = salon?.booking_settings?.change_deadline_hours ?? 0;
  if (deadlineHours <= 0) return null;

  // 予約開始日時を算出（DBの日付・時刻はJSTの壁時計値）
  const [year, month, day] = appointmentDate.split("-").map(Number);
  const [hour, minute] = startTime.split(":").map(Number);
  const appointmentTime = new Date(year, month - 1, day, hour, minute);

  // 締切 = 予約開始の X 時間前
  // 現在時刻もJSTの壁時計として読む。実行環境ローカルの `new Date()` を使うと、
  // UTCランタイムでは締切が常に9時間甘くなり、締切後の変更・キャンセルが通ってしまう
  const deadline = new Date(appointmentTime.getTime() - deadlineHours * 60 * 60 * 1000);
  const now = nowInJst();

  if (now > deadline) {
    const label = deadlineHours >= 24
      ? `${deadlineHours / 24}日前`
      : `${deadlineHours}時間前`;
    return `キャンセル・変更の受付期限（予約の${label}まで）を過ぎています。サロンへ直接ご連絡ください`;
  }

  return null;
}
