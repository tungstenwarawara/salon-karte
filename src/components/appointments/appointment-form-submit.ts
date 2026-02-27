import { createClient } from "@/lib/supabase/client";
import { isWithinBusinessHours, getScheduleForDate } from "@/lib/business-hours";
import type { TreatmentMenu, BusinessHours, BookingSettings } from "@/components/appointments/types";

type SubmitParams = {
  salonId: string;
  customerId: string;
  staffId: string | null;
  menus: TreatmentMenu[];
  selectedMenuIds: string[];
  appointmentDate: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  source: string;
  memo: string;
  businessHours?: BusinessHours | null;
  salonHolidays?: string[] | null;
  bookingSettings?: BookingSettings | null;
};

type SubmitResult =
  | { success: true; appointmentId: string }
  | { success: false; error: string };

/** 予約新規作成のsubmit処理（バリデーション・重複チェック・中間テーブル挿入） */
export async function submitAppointment(params: SubmitParams): Promise<SubmitResult> {
  const { salonId, customerId, staffId, menus, selectedMenuIds, appointmentDate, startHour, startMinute, endHour, endMinute, source, memo, businessHours, salonHolidays, bookingSettings } = params;
  const supabase = createClient();

  const startTime = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
  const endTime = `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;

  const startMin = Number(startHour) * 60 + Number(startMinute);
  const endMin = Number(endHour) * 60 + Number(endMinute);
  if (endMin <= startMin) return { success: false, error: "終了時間は開始時間より後にしてください" };

  // 営業時間チェック（警告として返す — 呼び出し元で確認ダイアログを表示）
  if (businessHours) {
    const withinHours = isWithinBusinessHours(businessHours, appointmentDate, startTime, endTime, salonHolidays);
    if (!withinHours) {
      const schedule = getScheduleForDate(businessHours, appointmentDate, salonHolidays);
      if (schedule.is_open) {
        return {
          success: false,
          error: `営業時間外の予約です（営業時間: ${schedule.open_time}〜${schedule.close_time}）。時間を修正してください`,
        };
      }
    }
  }

  // 予約受付制限チェック
  if (bookingSettings) {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (appointmentDate === todayStr) {
      if (!bookingSettings.same_day_enabled) {
        return { success: false, error: "当日予約は受け付けていません。翌日以降の日付を選択してください" };
      }
      if (bookingSettings.lead_time_minutes > 0) {
        const nowMin = now.getHours() * 60 + now.getMinutes();
        if (startMin < nowMin + bookingSettings.lead_time_minutes) {
          const h = Math.floor(bookingSettings.lead_time_minutes / 60);
          const m = bookingSettings.lead_time_minutes % 60;
          const label = h > 0 ? (m > 0 ? `${h}時間${m}分` : `${h}時間`) : `${m}分`;
          return { success: false, error: `予約は施術開始の${label}前までに行ってください` };
        }
      }
    }
  }

  // 同時予約数上限（デフォルト1）
  const maxConcurrent = bookingSettings?.max_concurrent_appointments ?? 1;

  // 重複チェック: サロン全体で予約を取得
  const { data: existing } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, customers(last_name, first_name)")
    .eq("salon_id", salonId)
    .eq("appointment_date", appointmentDate)
    .neq("status", "cancelled");

  if (existing && existing.length > 0) {
    const toMin = (t: string) => {
      const [hh, mm] = t.slice(0, 5).split(":").map(Number);
      return hh * 60 + mm;
    };
    const overlapping = existing.filter((apt) => {
      const eStart = toMin(apt.start_time);
      const eEnd = apt.end_time ? toMin(apt.end_time) : eStart + 60;
      return startMin < eEnd && eStart < endMin;
    });
    if (overlapping.length >= maxConcurrent) {
      if (maxConcurrent <= 1 && overlapping[0]) {
        const c = overlapping[0].customers as { last_name: string; first_name: string } | null;
        const name = c ? `${c.last_name} ${c.first_name}` : "別の顧客";
        return { success: false, error: `この時間帯には既に${name}様の予約があります（${overlapping[0].start_time.slice(0, 5)}〜）` };
      }
      return { success: false, error: `この時間帯の予約数が上限（${maxConcurrent}件）に達しています` };
    }
  }

  // メニュースナップショット作成
  const selectedMenusList = selectedMenuIds.map((id, index) => {
    const menu = menus.find((m) => m.id === id);
    return { id, menu, index };
  });
  const menuNameSnapshot = selectedMenusList.map(({ menu }) => menu?.name ?? "").filter(Boolean).join("、") || null;

  // 1. 予約本体をINSERT
  const { data: inserted, error: insertError } = await supabase
    .from("appointments")
    .insert({
      salon_id: salonId, customer_id: customerId, staff_id: staffId,
      menu_id: selectedMenuIds[0] || null, menu_name_snapshot: menuNameSnapshot,
      appointment_date: appointmentDate, start_time: startTime, end_time: endTime,
      source, memo: memo || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !inserted) {
    return { success: false, error: `予約の登録に失敗しました: ${insertError?.message ?? "不明なエラー"}` };
  }

  // 2. 中間テーブル挿入
  if (selectedMenuIds.length > 0) {
    const junctionRows = selectedMenusList.map(({ id, menu, index }) => ({
      appointment_id: inserted.id, menu_id: id,
      menu_name_snapshot: menu?.name ?? "", price_snapshot: menu?.price ?? null,
      duration_minutes_snapshot: menu?.duration_minutes ?? null, sort_order: index,
    }));
    const { error: junctionError } = await supabase.from("appointment_menus").insert(junctionRows);
    if (junctionError) console.error("Junction insert error:", junctionError);
  }

  return { success: true, appointmentId: inserted.id };
}
