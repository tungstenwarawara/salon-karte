import { createClient } from "@/lib/supabase/client";
import type { Menu, MenuPaymentInfo, PendingPurchase, RecordType } from "@/components/records/types";
import type { CancellationFeeState } from "@/components/records/cancellation-fee-fields";

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
  staffId: string | null;
  form: EditFormData;
  menus: Menu[];
  selectedMenuIds: string[];
  menuPayments: MenuPaymentInfo[];
  originalTicketPayments: Map<string, string>;
  pendingPurchases?: PendingPurchase[];
  customerId?: string;
  recordType: RecordType;
  /** キャンセル種別: 編集後のキャンセル料状態 */
  cancellationFee?: CancellationFeeState;
  /** キャンセル種別: 既存のキャンセル料行ID（編集前） */
  existingFeeMenuId?: string | null;
  /** キャンセル種別: 既存のキャンセル料で消化した回数券ID（編集前） */
  existingFeeTicketId?: string | null;
};

type UpdateResult =
  | { success: true }
  | { success: false; error: string };

/** カルテ編集のsubmit処理（種別別に最小限のフィールドだけ更新） */
export async function updateTreatmentRecord(params: UpdateParams): Promise<UpdateResult> {
  const { recordId, salonId, staffId, form, menus, selectedMenuIds, menuPayments, originalTicketPayments, recordType } = params;
  const supabase = createClient();

  // visit 以外は最小限のフィールドだけ更新して終了（メニュー/回数券/物販の整合性ロジックは visit 専用）
  if (recordType !== "visit") {
    const { error: simpleUpdateError } = await supabase.from("treatment_records").update({
      treatment_date: form.treatment_date,
      notes_after: form.notes_after || null,
    }).eq("id", recordId).eq("salon_id", salonId);
    if (simpleUpdateError) return { success: false, error: `更新に失敗しました: ${simpleUpdateError.message}` };

    // cancelled: キャンセル料の差分処理
    if (recordType === "cancelled") {
      const fee = params.cancellationFee;
      const existingId = params.existingFeeMenuId ?? null;
      const existingTicketId = params.existingFeeTicketId ?? null;

      const willHaveFee = !!fee?.enabled;

      // Case 1: 既存あり → 削除
      if (existingId && !willHaveFee) {
        await supabase.from("treatment_record_menus").delete().eq("id", existingId);
        if (existingTicketId) {
          await supabase.rpc("undo_course_ticket_session", { p_ticket_id: existingTicketId });
        }
      }
      // Case 2: 既存あり → 更新
      else if (existingId && willHaveFee && fee?.enabled) {
        await supabase.from("treatment_record_menus").update({
          menu_name_snapshot: "キャンセル料",
          price_snapshot: fee.amount,
          payment_type: fee.paymentType,
          ticket_id: fee.ticketId,
        }).eq("id", existingId);

        // 回数券の差分
        const newTicketId = fee.paymentType === "ticket" ? fee.ticketId : null;
        if (existingTicketId !== newTicketId) {
          if (existingTicketId) {
            await supabase.rpc("undo_course_ticket_session", { p_ticket_id: existingTicketId });
          }
          if (newTicketId) {
            await supabase.rpc("use_course_ticket_session", { p_ticket_id: newTicketId });
          }
        }
      }
      // Case 3: 既存なし → 新規作成
      else if (!existingId && willHaveFee && fee?.enabled) {
        await supabase.from("treatment_record_menus").insert({
          treatment_record_id: recordId,
          menu_id: null,
          menu_name_snapshot: "キャンセル料",
          price_snapshot: fee.amount,
          duration_minutes_snapshot: null,
          payment_type: fee.paymentType,
          ticket_id: fee.ticketId,
          sort_order: 0,
        });
        if (fee.paymentType === "ticket" && fee.ticketId) {
          await supabase.rpc("use_course_ticket_session", { p_ticket_id: fee.ticketId });
        }
      }
      // Case 4: 既存なし & 新規なし → 何もしない
    }

    // product_only は新規物販の追加だけ許可
    if (recordType === "product_only" && params.pendingPurchases && params.pendingPurchases.length > 0 && params.customerId) {
      for (const purchase of params.pendingPurchases) {
        if (purchase.mode === "product" && purchase.product_id) {
          const { error: rpcError } = await supabase.rpc("record_product_sale", {
            p_salon_id: salonId, p_customer_id: params.customerId, p_product_id: purchase.product_id,
            p_quantity: purchase.quantity, p_sell_price: purchase.unit_price,
            p_purchase_date: form.treatment_date, p_memo: purchase.memo || null, p_treatment_record_id: recordId,
          });
          if (rpcError) console.error("Product sale RPC error:", rpcError);
        } else {
          const { error: purchaseError } = await supabase.from("purchases").insert({
            salon_id: salonId, customer_id: params.customerId, purchase_date: form.treatment_date,
            item_name: purchase.item_name, quantity: purchase.quantity, unit_price: purchase.unit_price,
            total_price: purchase.quantity * purchase.unit_price, memo: purchase.memo || null, treatment_record_id: recordId,
          });
          if (purchaseError) console.error("Purchase insert error:", purchaseError);
        }
      }
    }

    return { success: true };
  }

  const firstMenuId = selectedMenuIds[0] || null;
  const menuNameSnapshot = selectedMenuIds.length > 0
    ? selectedMenuIds.map((mid) => menus.find((m) => m.id === mid)?.name).filter(Boolean).join("、") : null;

  // 1. カルテ本体をUPDATE
  const { error: updateError } = await supabase.from("treatment_records").update({
    staff_id: staffId,
    treatment_date: form.treatment_date, menu_id: firstMenuId, menu_name_snapshot: menuNameSnapshot,
    treatment_area: form.treatment_area || null, products_used: form.products_used || null,
    skin_condition_before: form.skin_condition_before || null, notes_after: form.notes_after || null,
    next_visit_memo: form.next_visit_memo || null, conversation_notes: form.conversation_notes || null,
    caution_notes: form.caution_notes || null,
  }).eq("id", recordId).eq("salon_id", salonId);

  if (updateError) return { success: false, error: `更新に失敗しました: ${updateError.message}` };

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

  // 4. 新規物販の追加
  if (params.pendingPurchases && params.pendingPurchases.length > 0 && params.customerId) {
    for (const purchase of params.pendingPurchases) {
      if (purchase.mode === "product" && purchase.product_id) {
        const { error: rpcError } = await supabase.rpc("record_product_sale", {
          p_salon_id: salonId, p_customer_id: params.customerId, p_product_id: purchase.product_id,
          p_quantity: purchase.quantity, p_sell_price: purchase.unit_price,
          p_purchase_date: form.treatment_date, p_memo: purchase.memo || null, p_treatment_record_id: recordId,
        });
        if (rpcError) console.error("Product sale RPC error:", rpcError);
      } else {
        const { error: purchaseError } = await supabase.from("purchases").insert({
          salon_id: salonId, customer_id: params.customerId, purchase_date: form.treatment_date,
          item_name: purchase.item_name, quantity: purchase.quantity, unit_price: purchase.unit_price,
          total_price: purchase.quantity * purchase.unit_price, memo: purchase.memo || null, treatment_record_id: recordId,
        });
        if (purchaseError) console.error("Purchase insert error:", purchaseError);
      }
    }
  }

  return { success: true };
}

/** カルテ削除処理（写真・回数券・物販の連鎖削除含む） */
export async function deleteTreatmentRecord(recordId: string, salonId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // サロン所有権を先に検証（子レコード操作前に確認）
  const { data: ownerCheck } = await supabase
    .from("treatment_records").select("id").eq("id", recordId).eq("salon_id", salonId).single();
  if (!ownerCheck) {
    return { success: false, error: "この施術記録を削除する権限がありません" };
  }

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
  const { data: linkedPurchasesToReverse } = await supabase.from("purchases").select("id, product_id").eq("treatment_record_id", recordId).eq("salon_id", salonId);
  if (linkedPurchasesToReverse) {
    for (const purchase of linkedPurchasesToReverse) {
      if (purchase.product_id) {
        const { error: reverseErr } = await supabase.rpc("reverse_product_sale", { p_purchase_id: purchase.id });
        if (reverseErr) console.error("Purchase reverse on delete error:", reverseErr);
      } else {
        await supabase.from("purchases").delete().eq("id", purchase.id).eq("salon_id", salonId);
      }
    }
  }

  // 回数券販売の削除
  await supabase.from("course_tickets").delete().eq("treatment_record_id", recordId).eq("salon_id", salonId);

  // 紐づく予約の参照をクリーンアップ
  await supabase.from("appointments")
    .update({ treatment_record_id: null, status: "scheduled" })
    .eq("treatment_record_id", recordId)
    .eq("salon_id", salonId);

  // カルテ本体の削除
  const { error } = await supabase.from("treatment_records").delete().eq("id", recordId).eq("salon_id", salonId);
  if (error) return { success: false, error: `削除に失敗しました: ${error.message}` };

  return { success: true };
}
