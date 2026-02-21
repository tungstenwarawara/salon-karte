import { createClient } from "@/lib/supabase/client";
import type { TreatmentMenu } from "@/components/appointments/types";

type EditParams = {
  appointmentId: string;
  salonId: string;
  menus: TreatmentMenu[];
  selectedMenuIds: string[];
  appointmentDate: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  source: string;
  memo: string;
};

type EditResult =
  | { success: true }
  | { success: false; error: string };

/** 予約編集のsubmit処理（バリデーション・重複チェック・中間テーブル差し替え） */
export async function updateAppointment(params: EditParams): Promise<EditResult> {
  const { appointmentId, salonId, menus, selectedMenuIds, appointmentDate, startHour, startMinute, endHour, endMinute, source, memo } = params;
  const supabase = createClient();

  const startTime = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
  const endTime = `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;

  const startMin = Number(startHour) * 60 + Number(startMinute);
  const endMin = Number(endHour) * 60 + Number(endMinute);
  if (endMin <= startMin) return { success: false, error: "終了時間は開始時間より後にしてください" };

  // 重複チェック（自分自身を除外）
  const { data: existing } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, customers(last_name, first_name)")
    .eq("salon_id", salonId)
    .eq("appointment_date", appointmentDate)
    .neq("status", "cancelled")
    .neq("id", appointmentId);

  if (existing && existing.length > 0) {
    const toMin = (t: string) => {
      const [hh, mm] = t.slice(0, 5).split(":").map(Number);
      return hh * 60 + mm;
    };
    const overlap = existing.find((apt) => {
      const eStart = toMin(apt.start_time);
      const eEnd = apt.end_time ? toMin(apt.end_time) : eStart + 60;
      return startMin < eEnd && eStart < endMin;
    });
    if (overlap) {
      const c = overlap.customers as { last_name: string; first_name: string } | null;
      const name = c ? `${c.last_name} ${c.first_name}` : "別の顧客";
      return { success: false, error: `この時間帯には既に${name}様の予約があります（${overlap.start_time.slice(0, 5)}〜）` };
    }
  }

  // メニュースナップショット
  const selectedMenusList = selectedMenuIds.map((id, index) => {
    const menu = menus.find((m) => m.id === id);
    return { id, menu, index };
  });
  const menuNameSnapshot = selectedMenusList.map(({ menu }) => menu?.name ?? "").filter(Boolean).join("、") || null;

  // 1. 予約本体をUPDATE
  const { error: updateError } = await supabase.from("appointments").update({
    menu_id: selectedMenuIds[0] || null, menu_name_snapshot: menuNameSnapshot,
    appointment_date: appointmentDate, start_time: startTime, end_time: endTime,
    source, memo: memo || null,
  }).eq("id", appointmentId).eq("salon_id", salonId);

  if (updateError) return { success: false, error: `予約の更新に失敗しました: ${updateError.message}` };

  // 2. 中間テーブル差し替え
  const { error: deleteError } = await supabase.from("appointment_menus").delete().eq("appointment_id", appointmentId);
  if (deleteError) return { success: false, error: `メニュー情報の更新に失敗しました: ${deleteError.message}` };

  if (selectedMenuIds.length > 0) {
    const junctionRows = selectedMenusList.map(({ id, menu, index }) => ({
      appointment_id: appointmentId, menu_id: id,
      menu_name_snapshot: menu?.name ?? "", price_snapshot: menu?.price ?? null,
      duration_minutes_snapshot: menu?.duration_minutes ?? null, sort_order: index,
    }));
    const { error: junctionError } = await supabase.from("appointment_menus").insert(junctionRows);
    if (junctionError) return { success: false, error: `メニュー情報の保存に失敗しました: ${junctionError.message}` };
  }

  return { success: true };
}
