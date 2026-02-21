import { createClient } from "@/lib/supabase/client";
import type { Menu, MenuPaymentInfo } from "@/components/records/types";

type EditFormData = {
  treatment_date: string;
  treatment_area: string;
  products_used: string;
  skin_condition_before: string;
  notes_after: string;
  next_visit_memo: string;
  conversation_notes: string;
  caution_notes: string;
};

type UpdateParams = {
  recordId: string;
  salonId: string;
  form: EditFormData;
  menus: Menu[];
  selectedMenuIds: string[];
  menuPayments: MenuPaymentInfo[];
  originalTicketPayments: Map<string, string>;
};

type UpdateResult =
  | { success: true }
  | { success: false; error: string };

/** カルテ編集のsubmit処理（メニュー更新・回数券diff処理） */
export async function updateTreatmentRecord(params: UpdateParams): Promise<UpdateResult> {
  const { recordId, salonId, form, menus, selectedMenuIds, menuPayments, originalTicketPayments } = params;
  const supabase = createClient();

  const firstMenuId = selectedMenuIds[0] || null;
  const menuNameSnapshot = selectedMenuIds.length > 0
    ? selectedMenuIds.map((mid) => menus.find((m) => m.id === mid)?.name).filter(Boolean).join("、") : null;

  // 1. カルテ本体をUPDATE
  const { error: updateError } = await supabase.from("treatment_records").update({
    treatment_date: form.treatment_date, menu_id: firstMenuId, menu_name_snapshot: menuNameSnapshot,
    treatment_area: form.treatment_area || null, products_used: form.products_used || null,
    skin_condition_before: form.skin_condition_before || null, notes_after: form.notes_after || null,
    next_visit_memo: form.next_visit_memo || null, conversation_notes: form.conversation_notes || null,
    caution_notes: form.caution_notes || null,
  }).eq("id", recordId).eq("salon_id", salonId);

  if (updateError) return { success: false, error: "更新に失敗しました" };

  // 2. メニュー中間テーブルを差し替え
  await supabase.from("treatment_record_menus").delete().eq("treatment_record_id", recordId);

  if (selectedMenuIds.length > 0) {
    const junctionRows = selectedMenuIds.map((menuId, index) => {
      const menu = menus.find((m) => m.id === menuId);
      const payment = menuPayments.find((mp) => mp.menuId === menuId);
      return {
        treatment_record_id: recordId, menu_id: menuId, menu_name_snapshot: menu?.name ?? "",
        price_snapshot: payment?.priceOverride ?? menu?.price ?? null,
        duration_minutes_snapshot: menu?.duration_minutes ?? null,
        payment_type: payment?.paymentType ?? "cash", ticket_id: payment?.ticketId ?? null, sort_order: index,
      };
    });
    const { error: junctionError } = await supabase.from("treatment_record_menus").insert(junctionRows);
    if (junctionError) console.error("Junction re-insert error:", junctionError);
  }

  // 3. 回数券消化のdiff処理
  const newTicketPayments = new Map<string, string>();
  menuPayments.forEach((mp) => { if (mp.paymentType === "ticket" && mp.ticketId) newTicketPayments.set(mp.menuId, mp.ticketId); });

  const oldTicketCounts = new Map<string, number>();
  originalTicketPayments.forEach((ticketId) => { oldTicketCounts.set(ticketId, (oldTicketCounts.get(ticketId) ?? 0) + 1); });
  const newTicketCounts = new Map<string, number>();
  newTicketPayments.forEach((ticketId) => { newTicketCounts.set(ticketId, (newTicketCounts.get(ticketId) ?? 0) + 1); });

  const allTicketIds = new Set([...oldTicketCounts.keys(), ...newTicketCounts.keys()]);
  for (const ticketId of allTicketIds) {
    const diff = (newTicketCounts.get(ticketId) ?? 0) - (oldTicketCounts.get(ticketId) ?? 0);
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        const { error: useError } = await supabase.rpc("use_course_ticket_session", { p_ticket_id: ticketId });
        if (useError) console.error("Ticket consumption error:", useError);
      }
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) {
        const { error: undoError } = await supabase.rpc("undo_course_ticket_session", { p_ticket_id: ticketId });
        if (undoError) console.error("Ticket undo error:", undoError);
      }
    }
  }

  return { success: true };
}

/** カルテ削除処理（写真・回数券・物販の連鎖削除含む） */
export async function deleteTreatmentRecord(recordId: string, salonId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // 写真の削除
  const { data: photos } = await supabase.from("treatment_photos").select("storage_path").eq("treatment_record_id", recordId);
  if (photos && photos.length > 0) await supabase.storage.from("treatment-photos").remove(photos.map((p) => p.storage_path));

  // 回数券消化の取消
  const { data: recordMenusToUndo } = await supabase.from("treatment_record_menus").select("ticket_id")
    .eq("treatment_record_id", recordId).eq("payment_type", "ticket").not("ticket_id", "is", null);
  if (recordMenusToUndo) {
    for (const rm of recordMenusToUndo) {
      if (rm.ticket_id) {
        const { error: undoErr } = await supabase.rpc("undo_course_ticket_session", { p_ticket_id: rm.ticket_id });
        if (undoErr) console.error("Ticket undo on delete error:", undoErr);
      }
    }
  }

  // 物販の取消
  const { data: linkedPurchasesToReverse } = await supabase.from("purchases").select("id, product_id").eq("treatment_record_id", recordId);
  if (linkedPurchasesToReverse) {
    for (const purchase of linkedPurchasesToReverse) {
      if (purchase.product_id) {
        const { error: reverseErr } = await supabase.rpc("reverse_product_sale", { p_purchase_id: purchase.id });
        if (reverseErr) console.error("Purchase reverse on delete error:", reverseErr);
      } else {
        await supabase.from("purchases").delete().eq("id", purchase.id);
      }
    }
  }

  // 回数券販売の削除
  await supabase.from("course_tickets").delete().eq("treatment_record_id", recordId);

  // カルテ本体の削除
  const { error } = await supabase.from("treatment_records").delete().eq("id", recordId).eq("salon_id", salonId);
  if (error) return { success: false, error: "削除に失敗しました" };

  return { success: true };
}
