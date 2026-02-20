"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { MenuSelector } from "@/components/records/menu-selector";
import { PaymentSection } from "@/components/records/payment-section";
import { CourseTicketInfo } from "@/components/records/course-ticket-info";
import { INPUT_CLASS } from "@/components/records/types";
import type { Menu, CourseTicket, MenuPaymentInfo } from "@/components/records/types";
import type { Database } from "@/types/database";

type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type TreatmentRecordMenu = Database["public"]["Tables"]["treatment_record_menus"]["Row"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

export default function EditRecordPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");

  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [menuPayments, setMenuPayments] = useState<MenuPaymentInfo[]>([]);

  const [courseTickets, setCourseTickets] = useState<CourseTicket[]>([]);
  const [hasTickets, setHasTickets] = useState(false);
  const [originalTicketPayments, setOriginalTicketPayments] = useState<Map<string, string>>(new Map());

  const [linkedPurchases, setLinkedPurchases] = useState<Purchase[]>([]);
  const [linkedTickets, setLinkedTickets] = useState<CourseTicket[]>([]);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);

  const [form, setForm] = useState({
    treatment_date: "", treatment_area: "", products_used: "",
    skin_condition_before: "", notes_after: "", next_visit_memo: "",
    conversation_notes: "", caution_notes: "",
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).single<{ id: string }>();
      if (!salon) return;
      setSalonId(salon.id);

      const [menuRes, recordRes, recordMenusRes, purchasesRes, linkedTicketsRes] = await Promise.all([
        supabase.from("treatment_menus").select("*").eq("salon_id", salon.id).order("name").returns<Menu[]>(),
        supabase.from("treatment_records").select("*").eq("id", id).eq("salon_id", salon.id).single<TreatmentRecord>(),
        supabase.from("treatment_record_menus").select("*").eq("treatment_record_id", id).order("sort_order").returns<TreatmentRecordMenu[]>(),
        supabase.from("purchases").select("*").eq("treatment_record_id", id).order("created_at").returns<Purchase[]>(),
        supabase.from("course_tickets").select("*").eq("treatment_record_id", id).order("created_at").returns<CourseTicket[]>(),
      ]);

      setMenus(menuRes.data ?? []);
      setLinkedPurchases(purchasesRes.data ?? []);
      setLinkedTickets(linkedTicketsRes.data ?? []);
      const existingMenus = recordMenusRes.data ?? [];

      const record = recordRes.data;
      if (record) {
        setCustomerId(record.customer_id);
        setForm({
          treatment_date: record.treatment_date, treatment_area: record.treatment_area ?? "",
          products_used: record.products_used ?? "", skin_condition_before: record.skin_condition_before ?? "",
          notes_after: record.notes_after ?? "", next_visit_memo: record.next_visit_memo ?? "",
          conversation_notes: record.conversation_notes ?? "", caution_notes: record.caution_notes ?? "",
        });

        if (existingMenus.length > 0) {
          const ids = existingMenus.map((rm) => rm.menu_id).filter(Boolean) as string[];
          setSelectedMenuIds(ids);
          const allMenus = menuRes.data ?? [];
          setMenuPayments(existingMenus.map((rm) => {
            const currentMenu = allMenus.find((m) => m.id === rm.menu_id);
            const isOverridden = rm.price_snapshot != null && currentMenu?.price != null && rm.price_snapshot !== currentMenu.price;
            return {
              menuId: rm.menu_id ?? "", paymentType: (rm.payment_type as MenuPaymentInfo["paymentType"]) ?? "cash",
              ticketId: rm.ticket_id, priceOverride: isOverridden ? rm.price_snapshot : null,
            };
          }).filter((mp) => mp.menuId));

          const origTickets = new Map<string, string>();
          existingMenus.forEach((rm) => {
            if (rm.payment_type === "ticket" && rm.ticket_id && rm.menu_id) origTickets.set(rm.menu_id, rm.ticket_id);
          });
          setOriginalTicketPayments(origTickets);
        } else if (record.menu_id) {
          setSelectedMenuIds([record.menu_id]);
          setMenuPayments([{ menuId: record.menu_id, paymentType: "cash", ticketId: null, priceOverride: null }]);
        }

        const { count } = await supabase.from("course_tickets").select("id", { count: "exact", head: true })
          .eq("customer_id", record.customer_id).eq("salon_id", salon.id).eq("status", "active");
        if (count && count > 0) {
          setHasTickets(true);
          const { data: tickets } = await supabase.from("course_tickets").select("*")
            .eq("customer_id", record.customer_id).eq("salon_id", salon.id).eq("status", "active")
            .order("purchase_date", { ascending: false }).returns<CourseTicket[]>();
          setCourseTickets(tickets ?? []);
        }
      }
    };
    load();
  }, [id]);

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleMenu = (menuId: string) => {
    const newIds = selectedMenuIds.includes(menuId) ? selectedMenuIds.filter((mid) => mid !== menuId) : [...selectedMenuIds, menuId];
    setSelectedMenuIds(newIds);
    if (newIds.includes(menuId) && !menuPayments.find((mp) => mp.menuId === menuId)) {
      setMenuPayments((prev) => [...prev, { menuId, paymentType: "cash", ticketId: null, priceOverride: null }]);
    } else if (!newIds.includes(menuId)) {
      setMenuPayments((prev) => prev.filter((mp) => mp.menuId !== menuId));
    }
  };

  const updateMenuPayment = (menuId: string, paymentType: MenuPaymentInfo["paymentType"], ticketId: string | null = null) => {
    setMenuPayments((prev) => prev.map((mp) =>
      mp.menuId === menuId ? { ...mp, paymentType, ticketId: paymentType === "ticket" ? ticketId : null } : mp
    ));
  };

  const updateMenuPrice = (menuId: string, price: number | null) => {
    setMenuPayments((prev) => prev.map((mp) => mp.menuId === menuId ? { ...mp, priceOverride: price } : mp));
  };

  const updateMenuTicket = (menuId: string, ticketId: string) => {
    setMenuPayments((prev) => prev.map((mp) => mp.menuId === menuId ? { ...mp, ticketId } : mp));
  };

  const setAllPaymentType = (paymentType: "cash" | "credit") => {
    setMenuPayments((prev) => selectedMenuIds.map((mid) => {
      const existing = prev.find((mp) => mp.menuId === mid);
      return { menuId: mid, paymentType, ticketId: null, priceOverride: existing?.priceOverride ?? null };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createClient();

    const firstMenuId = selectedMenuIds[0] || null;
    const menuNameSnapshot = selectedMenuIds.length > 0
      ? selectedMenuIds.map((mid) => menus.find((m) => m.id === mid)?.name).filter(Boolean).join("、") : null;

    const { error: updateError } = await supabase.from("treatment_records").update({
      treatment_date: form.treatment_date, menu_id: firstMenuId, menu_name_snapshot: menuNameSnapshot,
      treatment_area: form.treatment_area || null, products_used: form.products_used || null,
      skin_condition_before: form.skin_condition_before || null, notes_after: form.notes_after || null,
      next_visit_memo: form.next_visit_memo || null, conversation_notes: form.conversation_notes || null,
      caution_notes: form.caution_notes || null,
    }).eq("id", id).eq("salon_id", salonId);

    if (updateError) { setError("更新に失敗しました"); setLoading(false); return; }

    await supabase.from("treatment_record_menus").delete().eq("treatment_record_id", id);

    if (selectedMenuIds.length > 0) {
      const junctionRows = selectedMenuIds.map((menuId, index) => {
        const menu = menus.find((m) => m.id === menuId);
        const payment = menuPayments.find((mp) => mp.menuId === menuId);
        return {
          treatment_record_id: id, menu_id: menuId, menu_name_snapshot: menu?.name ?? "",
          price_snapshot: payment?.priceOverride ?? menu?.price ?? null,
          duration_minutes_snapshot: menu?.duration_minutes ?? null,
          payment_type: payment?.paymentType ?? "cash", ticket_id: payment?.ticketId ?? null, sort_order: index,
        };
      });
      const { error: junctionError } = await supabase.from("treatment_record_menus").insert(junctionRows);
      if (junctionError) console.error("Junction re-insert error:", junctionError);
    }

    // 回数券消化のdiff処理
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

    router.push(`/records/${id}`);
  };

  const handleDelete = async () => {
    if (!confirm("この施術記録を削除しますか？")) return;
    setDeleting(true);
    const supabase = createClient();

    const { data: photos } = await supabase.from("treatment_photos").select("storage_path").eq("treatment_record_id", id);
    if (photos && photos.length > 0) await supabase.storage.from("treatment-photos").remove(photos.map((p) => p.storage_path));

    const { data: recordMenusToUndo } = await supabase.from("treatment_record_menus").select("ticket_id")
      .eq("treatment_record_id", id).eq("payment_type", "ticket").not("ticket_id", "is", null);
    if (recordMenusToUndo) {
      for (const rm of recordMenusToUndo) {
        if (rm.ticket_id) {
          const { error: undoErr } = await supabase.rpc("undo_course_ticket_session", { p_ticket_id: rm.ticket_id });
          if (undoErr) console.error("Ticket undo on delete error:", undoErr);
        }
      }
    }

    const { data: linkedPurchasesToReverse } = await supabase.from("purchases").select("id, product_id").eq("treatment_record_id", id);
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

    await supabase.from("course_tickets").delete().eq("treatment_record_id", id);

    const { error } = await supabase.from("treatment_records").delete().eq("id", id).eq("salon_id", salonId);
    if (error) { setError("削除に失敗しました"); setDeleting(false); return; }

    router.push(customerId ? `/customers/${customerId}` : "/dashboard");
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm("この物販記録を削除しますか？")) return;
    setDeletingPurchaseId(purchaseId);
    const supabase = createClient();
    const purchase = linkedPurchases.find((p) => p.id === purchaseId);

    if (purchase?.product_id) {
      const { error: rpcError } = await supabase.rpc("reverse_product_sale", { p_purchase_id: purchaseId });
      if (rpcError) { setError("物販の削除に失敗しました"); setDeletingPurchaseId(null); return; }
    } else {
      const { error: delError } = await supabase.from("purchases").delete().eq("id", purchaseId);
      if (delError) { setError("物販の削除に失敗しました"); setDeletingPurchaseId(null); return; }
    }
    setLinkedPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
    setDeletingPurchaseId(null);
  };

  const handleDeleteLinkedTicket = async (ticketId: string) => {
    if (!confirm("この回数券を削除しますか？")) return;
    setDeletingTicketId(ticketId);
    const supabase = createClient();
    const { error: delError } = await supabase.from("course_tickets").delete().eq("id", ticketId);
    if (delError) { setError("回数券の削除に失敗しました"); setDeletingTicketId(null); return; }
    setLinkedTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setDeletingTicketId(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="施術記録を編集" backLabel="戻る" breadcrumbs={[{ label: "カルテ編集" }]} />

      <CourseTicketInfo courseTickets={courseTickets} />

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {error && <ErrorAlert message={error} />}

        <div>
          <label className="block text-sm font-medium mb-1.5">施術日 <span className="text-error">*</span></label>
          <input type="date" value={form.treatment_date} onChange={(e) => updateField("treatment_date", e.target.value)} required className={INPUT_CLASS} />
        </div>

        <MenuSelector menus={menus} selectedMenuIds={selectedMenuIds} menuPayments={menuPayments} onToggle={toggleMenu} />

        <PaymentSection
          menus={menus} selectedMenuIds={selectedMenuIds} menuPayments={menuPayments}
          courseTickets={courseTickets} hasTickets={hasTickets}
          onSetAllPaymentType={setAllPaymentType} onUpdatePayment={updateMenuPayment}
          onUpdatePrice={updateMenuPrice} onUpdateTicket={updateMenuTicket}
        />

        <div>
          <label className="block text-sm font-medium mb-1.5">施術部位</label>
          <input type="text" value={form.treatment_area} onChange={(e) => updateField("treatment_area", e.target.value)} className={INPUT_CLASS} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">使用した化粧品・機器</label>
          <AutoResizeTextarea value={form.products_used} onChange={(e) => updateField("products_used", e.target.value)} minRows={2} className={INPUT_CLASS} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">施術前の状態</label>
          <AutoResizeTextarea value={form.skin_condition_before} onChange={(e) => updateField("skin_condition_before", e.target.value)} minRows={2} className={INPUT_CLASS} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">施術後の経過メモ</label>
          <AutoResizeTextarea value={form.notes_after} onChange={(e) => updateField("notes_after", e.target.value)} minRows={2} className={INPUT_CLASS} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">話した内容（会話メモ）</label>
          <AutoResizeTextarea value={form.conversation_notes} onChange={(e) => updateField("conversation_notes", e.target.value)} minRows={3} className={INPUT_CLASS} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">注意事項</label>
          <AutoResizeTextarea value={form.caution_notes} onChange={(e) => updateField("caution_notes", e.target.value)} minRows={2} className={INPUT_CLASS} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">次回への申し送り</label>
          <AutoResizeTextarea value={form.next_visit_memo} onChange={(e) => updateField("next_visit_memo", e.target.value)} minRows={2} className={INPUT_CLASS} />
        </div>

        {/* 紐づく回数券販売 */}
        {linkedTickets.length > 0 && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-bold mb-2">回数券販売</h3>
            <div className="space-y-2">
              {linkedTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between bg-background rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ticket.ticket_name}</p>
                    <p className="text-xs text-text-light">{ticket.total_sessions}回{ticket.price != null ? ` / ${ticket.price.toLocaleString()}円` : ""}</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteLinkedTicket(ticket.id)} disabled={deletingTicketId === ticket.id}
                    className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50">
                    {deletingTicketId === ticket.id ? "削除中..." : "削除"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 紐づく物販記録 */}
        {linkedPurchases.length > 0 && (
          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-bold mb-2">物販記録</h3>
            <div className="space-y-2">
              {linkedPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between bg-background rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{purchase.item_name}</p>
                    <p className="text-xs text-text-light">
                      {purchase.quantity}個 × {purchase.unit_price.toLocaleString()}円 = {purchase.total_price.toLocaleString()}円
                      {purchase.product_id && " (在庫連動)"}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleDeletePurchase(purchase.id)} disabled={deletingPurchaseId === purchase.id}
                    className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50">
                    {deletingPurchaseId === purchase.id ? "削除中..." : "削除"}
                  </button>
                </div>
              ))}
              {linkedPurchases.length > 1 && (
                <div className="flex items-center justify-between bg-accent/5 rounded-xl px-3 py-2">
                  <span className="text-xs text-text-light">合計</span>
                  <span className="text-sm font-bold text-accent">{linkedPurchases.reduce((s, p) => s + p.total_price, 0).toLocaleString()}円</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]">キャンセル</button>
          <button type="submit" disabled={loading} className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]">{loading ? "保存中..." : "保存する"}</button>
        </div>
      </form>

      <div className="bg-surface border border-error/20 rounded-2xl p-5">
        <h3 className="font-bold text-sm text-error mb-2">危険な操作</h3>
        <p className="text-sm text-text-light mb-3">この施術記録を削除します。この操作は取り消せません。</p>
        <button onClick={handleDelete} disabled={deleting}
          className="bg-error/10 text-error text-sm font-medium rounded-xl px-4 py-2 hover:bg-error/20 transition-colors disabled:opacity-50 min-h-[40px]">
          {deleting ? "削除中..." : "この記録を削除"}
        </button>
      </div>
    </div>
  );
}
