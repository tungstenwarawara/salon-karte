import { createClient } from "@/lib/supabase/client";
import type { TreatmentMenu } from "@/components/appointments/types";

type SubmitParams = {
  salonId: string;
  customerId: string;
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

type SubmitResult =
  | { success: true; appointmentId: string }
  | { success: false; error: string };

/** 予約新規作成のsubmit処理（バリデーション・重複チェック・中間テーブル挿入） */
export async function submitAppointment(params: SubmitParams): Promise<SubmitResult> {
  const { salonId, customerId, menus, selectedMenuIds, appointmentDate, startHour, startMinute, endHour, endMinute, source, memo } = params;
  const supabase = createClient();

  const startTime = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
  const endTime = `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;

  const startMin = Number(startHour) * 60 + Number(startMinute);
  const endMin = Number(endHour) * 60 + Number(endMinute);
  if (endMin <= startMin) return { success: false, error: "終了時間は開始時間より後にしてください" };

  // 重複チェック
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
      salon_id: salonId, customer_id: customerId,
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
