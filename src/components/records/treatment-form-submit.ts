import { createClient } from "@/lib/supabase/client";
import { uploadPhotos } from "@/lib/supabase/storage";
import type { PhotoEntry } from "@/components/records/photo-upload";
import type { Menu, MenuPaymentInfo, PendingTicket, PendingPurchase, CourseTicket, RecordType } from "@/components/records/types";

type RecordFormData = {
  treatment_date: string;
  treatment_area: string;
  products_used: string;
  skin_condition_before: string;
  notes_after: string;
  next_visit_memo: string;
  conversation_notes: string;
  caution_notes: string;
};

type SubmitParams = {
  customerId: string;
  salonId: string;
  staffId: string | null;
  form: RecordFormData;
  menus: Menu[];
  selectedMenuIds: string[];
  menuPayments: MenuPaymentInfo[];
  pendingTickets: PendingTicket[];
  pendingPurchases: PendingPurchase[];
  photos: PhotoEntry[];
  appointmentId: string | null;
  courseTickets?: CourseTicket[];
  recordType: RecordType;
};

type TicketConsumptionInfo = {
  ticketName: string;
  consumed: number;
  remaining: number;
};

type SubmitResult =
  | { success: true; recordId: string; ticketConsumptions?: TicketConsumptionInfo[] }
  | { success: false; error: string };

/** カルテ新規作成のsubmit処理（メニュー・回数券・物販・写真の一括保存） */
export async function submitTreatmentRecord(params: SubmitParams): Promise<SubmitResult> {
  const { customerId, salonId, staffId, form, menus, selectedMenuIds, menuPayments, pendingTickets, pendingPurchases, photos, appointmentId, recordType } = params;
  const supabase = createClient();

  // visit以外は施術関連フィールドを記録しない
  const isVisit = recordType === "visit";
  const firstMenuId = isVisit ? (selectedMenuIds[0] || null) : null;
  const menuNameSnapshot = isVisit && selectedMenuIds.length > 0
    ? selectedMenuIds.map((id) => menus.find((m) => m.id === id)?.name).filter(Boolean).join("、") : null;

  // 1. カルテ本体をINSERT
  const { data: record, error: insertError } = await supabase
    .from("treatment_records")
    .insert({
      customer_id: customerId, salon_id: salonId, staff_id: staffId, treatment_date: form.treatment_date,
      menu_id: firstMenuId, menu_name_snapshot: menuNameSnapshot,
      treatment_area: isVisit ? (form.treatment_area || null) : null,
      products_used: isVisit ? (form.products_used || null) : null,
      skin_condition_before: isVisit ? (form.skin_condition_before || null) : null,
      notes_after: form.notes_after || null,
      next_visit_memo: isVisit ? (form.next_visit_memo || null) : null,
      conversation_notes: isVisit ? (form.conversation_notes || null) : null,
      caution_notes: form.caution_notes || null,
      record_type: recordType,
      appointment_id: recordType === "cancelled" ? appointmentId : null,
    })
    .select("id").single<{ id: string }>();

  if (insertError || !record) return { success: false, error: `登録に失敗しました: ${insertError?.message ?? "不明なエラー"}` };

  const warnings: string[] = [];
  const ticketConsumptions: TicketConsumptionInfo[] = [];

  // 2. メニュー中間テーブル + 回数券消化
  if (selectedMenuIds.length > 0) {
    const junctionRows = selectedMenuIds.map((menuId, index) => {
      const menu = menus.find((m) => m.id === menuId);
      const payment = menuPayments.find((mp) => mp.menuId === menuId);
      return {
        treatment_record_id: record.id, menu_id: menuId,
        menu_name_snapshot: menu?.name ?? "", price_snapshot: payment?.priceOverride ?? menu?.price ?? null,
        duration_minutes_snapshot: menu?.duration_minutes ?? null,
        payment_type: payment?.paymentType ?? "cash", ticket_id: payment?.ticketId ?? null, sort_order: index,
      };
    });
    const { error: junctionError } = await supabase.from("treatment_record_menus").insert(junctionRows);
    if (junctionError) console.error("Junction insert error:", junctionError);

    // 回数券消化
    const ticketUseCounts = new Map<string, number>();
    menuPayments.forEach((mp) => {
      if (mp.paymentType === "ticket" && mp.ticketId) ticketUseCounts.set(mp.ticketId, (ticketUseCounts.get(mp.ticketId) ?? 0) + 1);
    });
    for (const [ticketId, count] of ticketUseCounts) {
      const ticket = params.courseTickets?.find((t) => t.id === ticketId);
      let lastResult: { used_sessions: number; status: string } | null = null;
      for (let i = 0; i < count; i++) {
        const { data, error: ticketError } = await supabase.rpc("use_course_ticket_session", { p_ticket_id: ticketId });
        if (ticketError) { console.error("Ticket consumption error:", ticketError); warnings.push(`回数券の消化に失敗しました: ${ticketError.message}`); }
        else if (data) lastResult = data as unknown as { used_sessions: number; status: string };
      }
      if (lastResult && ticket) {
        ticketConsumptions.push({
          ticketName: ticket.ticket_name,
          consumed: count,
          remaining: ticket.total_sessions - lastResult.used_sessions,
        });
      }
    }
  }

  // 3. 新規回数券販売
  if (pendingTickets.length > 0) {
    const ticketRows = pendingTickets.map((t) => ({
      salon_id: salonId, customer_id: customerId, ticket_name: t.ticket_name,
      total_sessions: t.total_sessions, purchase_date: form.treatment_date,
      price: t.price, memo: t.memo || null, treatment_record_id: record.id,
      payment_type: t.payment_type,
    }));
    const { error: ticketInsertError } = await supabase.from("course_tickets").insert(ticketRows);
    if (ticketInsertError) { console.error("Ticket insert error:", ticketInsertError); warnings.push("回数券の登録に失敗しました"); }
  }

  // 4. 物販記録
  for (const purchase of pendingPurchases) {
    if (purchase.mode === "product" && purchase.product_id) {
      const { error: rpcError } = await supabase.rpc("record_product_sale", {
        p_salon_id: salonId, p_customer_id: customerId, p_product_id: purchase.product_id,
        p_quantity: purchase.quantity, p_sell_price: purchase.unit_price,
        p_purchase_date: form.treatment_date, p_memo: purchase.memo || null, p_treatment_record_id: record.id,
        p_payment_type: purchase.payment_type,
      });
      if (rpcError) { console.error("Product sale RPC error:", rpcError); warnings.push("物販の在庫連動に失敗しました"); }
    } else {
      const { error: purchaseError } = await supabase.from("purchases").insert({
        salon_id: salonId, customer_id: customerId, purchase_date: form.treatment_date,
        item_name: purchase.item_name, quantity: purchase.quantity, unit_price: purchase.unit_price,
        total_price: purchase.quantity * purchase.unit_price, memo: purchase.memo || null, treatment_record_id: record.id,
        payment_type: purchase.payment_type,
      });
      if (purchaseError) { console.error("Purchase insert error:", purchaseError); warnings.push("物販の登録に失敗しました"); }
    }
  }

  // 5. 写真アップロード
  if (photos.length > 0) {
    const { errors: photoErrors } = await uploadPhotos(record.id, salonId, photos);
    if (photoErrors.length > 0) warnings.push("一部の写真のアップロードに失敗しました");
  }

  // 6. 予約ステータス更新（種別ごとに挙動を分岐）
  if (appointmentId) {
    if (recordType === "visit") {
      // 来店記録 → 予約を完了扱いにし、カルテIDを紐付け
      await supabase.from("appointments").update({ treatment_record_id: record.id, status: "completed" }).eq("id", appointmentId).eq("salon_id", salonId);
    } else if (recordType === "cancelled") {
      // キャンセル記録 → 予約も cancelled に同期（treatment_record_id は紐付けず、cancelled カルテ側の appointment_id で関連付け）
      await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointmentId).eq("salon_id", salonId);
    }
    // product_only / memo は予約状態に影響しない
  }

  if (warnings.length > 0) {
    return { success: false, error: `施術記録は保存されましたが、以下の問題があります: ${warnings.join("、")}` };
  }

  return { success: true, recordId: record.id, ticketConsumptions: ticketConsumptions.length > 0 ? ticketConsumptions : undefined };
}
