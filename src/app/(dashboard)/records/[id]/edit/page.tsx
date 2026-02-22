"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { setFlashToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { MenuSelector } from "@/components/records/menu-selector";
import { PaymentSection } from "@/components/records/payment-section";
import { CourseTicketInfo } from "@/components/records/course-ticket-info";
import { TreatmentDetailFields } from "@/components/records/treatment-detail-fields";
import { TreatmentLinkedItems } from "@/components/records/treatment-linked-items";
import { TreatmentDeleteSection } from "@/components/records/treatment-delete-section";
import { updateTreatmentRecord, deleteTreatmentRecord } from "@/components/records/treatment-edit-submit";
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
        supabase.from("treatment_menus").select("id, name, category, duration_minutes, price, is_active").eq("salon_id", salon.id).order("name").returns<Menu[]>(),
        supabase.from("treatment_records").select("id, customer_id, treatment_date, menu_id, treatment_area, products_used, skin_condition_before, notes_after, next_visit_memo, conversation_notes, caution_notes").eq("id", id).eq("salon_id", salon.id).single<TreatmentRecord>(),
        supabase.from("treatment_record_menus").select("id, menu_id, menu_name_snapshot, price_snapshot, duration_minutes_snapshot, payment_type, ticket_id, sort_order").eq("treatment_record_id", id).order("sort_order").returns<TreatmentRecordMenu[]>(),
        supabase.from("purchases").select("id, item_name, quantity, unit_price, total_price, memo, product_id").eq("treatment_record_id", id).eq("salon_id", salon.id).order("created_at").returns<Purchase[]>(),
        supabase.from("course_tickets").select("id, ticket_name, total_sessions, used_sessions, price, status, memo").eq("treatment_record_id", id).eq("salon_id", salon.id).order("created_at").returns<CourseTicket[]>(),
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
          const { data: tickets } = await supabase.from("course_tickets")
            .select("id, ticket_name, total_sessions, used_sessions, price, status, memo, expiry_date")
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
  const setAllService = () => {
    setMenuPayments((prev) => selectedMenuIds.map((mid) => {
      const existing = prev.find((mp) => mp.menuId === mid);
      return { menuId: mid, paymentType: "service" as const, ticketId: null, priceOverride: existing?.priceOverride ?? null };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const result = await updateTreatmentRecord({
      recordId: id, salonId, form, menus, selectedMenuIds, menuPayments, originalTicketPayments,
    });
    if (!result.success) { setError(result.error); setLoading(false); return; }
    setFlashToast("施術記録を更新しました");
    router.push(`/records/${id}`);
  };

  const handleDelete = async () => {
    if (!confirm("この施術記録を削除しますか？")) return;
    setDeleting(true);
    const result = await deleteTreatmentRecord(id, salonId);
    if (!result.success) { setError(result.error ?? "削除に失敗しました"); setDeleting(false); return; }
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
      <PageHeader title="施術記録を編集" breadcrumbs={[{ label: "カルテ編集" }]} />

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
          onSetAllPaymentType={setAllPaymentType} onSetAllService={setAllService}
          onUpdatePayment={updateMenuPayment} onUpdatePrice={updateMenuPrice}
          onUpdateTicket={updateMenuTicket}
        />

        <div>
          <label className="block text-sm font-medium mb-1.5">施術部位</label>
          <input type="text" value={form.treatment_area} onChange={(e) => updateField("treatment_area", e.target.value)} className={INPUT_CLASS} />
        </div>

        <TreatmentDetailFields form={form} onUpdate={updateField} />

        <TreatmentLinkedItems
          linkedTickets={linkedTickets} linkedPurchases={linkedPurchases}
          deletingTicketId={deletingTicketId} deletingPurchaseId={deletingPurchaseId}
          onDeleteTicket={handleDeleteLinkedTicket} onDeletePurchase={handleDeletePurchase}
        />

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]">キャンセル</button>
          <button type="submit" disabled={loading} className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]">{loading ? "保存中..." : "保存する"}</button>
        </div>
      </form>

      <div className="mt-4">
        <CollapsibleSection label="この記録を削除する">
          <TreatmentDeleteSection deleting={deleting} onDelete={handleDelete} />
        </CollapsibleSection>
      </div>
    </div>
  );
}
