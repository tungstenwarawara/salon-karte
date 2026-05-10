"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PhotoUpload, type PhotoEntry } from "@/components/records/photo-upload";
import { PageHeader } from "@/components/layout/page-header";
import { setFlashToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { trackEvent } from "@/lib/analytics";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { SubmitButton } from "@/components/ui/submit-button";
import { MenuSelector } from "@/components/records/menu-selector";
import { PaymentSection } from "@/components/records/payment-section";
import { CourseTicketInfo } from "@/components/records/course-ticket-info";
import { CustomerSelector } from "@/components/records/customer-selector";
import { TicketInlineForm } from "@/components/records/ticket-inline-form";
import { PurchaseInlineForm } from "@/components/records/purchase-inline-form";
import { TreatmentDetailFields } from "@/components/records/treatment-detail-fields";
import { submitTreatmentRecord } from "@/components/records/treatment-form-submit";
import { INPUT_CLASS } from "@/components/records/types";
import { AppointmentSelector, type SelectedAppointment } from "@/components/records/appointment-selector";
import type { Menu, CourseTicket, Product, CustomerOption, MenuPaymentInfo, PendingTicket, PendingPurchase } from "@/components/records/types";
import type { Database } from "@/types/database";

type AppointmentMenu = Database["public"]["Tables"]["appointment_menus"]["Row"];

export default function NewRecordPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-light py-8">読み込み中...</div>}>
      <NewRecordForm />
    </Suspense>
  );
}

function NewRecordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCustomerId = searchParams.get("customer");
  const appointmentParam = searchParams.get("appointment");
  const dateParam = searchParams.get("date");

  const [appointmentStepDone, setAppointmentStepDone] = useState(!!(presetCustomerId || appointmentParam));
  const [menus, setMenus] = useState<Menu[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(presetCustomerId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [salonId, setSalonId] = useState("");
  const [planType, setPlanType] = useState<"free" | "standard">("free");
  const [customerName, setCustomerName] = useState("");
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [menuPayments, setMenuPayments] = useState<MenuPaymentInfo[]>([]);
  const [courseTickets, setCourseTickets] = useState<CourseTicket[]>([]);
  const [hasTickets, setHasTickets] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [linkedAppointmentId, setLinkedAppointmentId] = useState<string | null>(appointmentParam);

  const customerId = presetCustomerId ?? selectedCustomerId;
  const appointmentId = linkedAppointmentId;

  const [form, setForm] = useState(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { treatment_date: dateParam ?? today, treatment_area: "", products_used: "", skin_condition_before: "", notes_after: "", next_visit_memo: "", conversation_notes: "", caution_notes: "" };
  });

  // 初期データ読み込み
  useEffect(() => {
    const load = async () => {
      const { user, salonId: resolvedSalonId, staff } = await getClientAuth();
      if (!user || !resolvedSalonId) return;
      setSalonId(resolvedSalonId);

      const supabase = createClient();

      // プラン情報も読み込む（写真機能ロックの判定に使う）
      const { data: salonRow } = await supabase.from("salons").select("plan_type").eq("id", resolvedSalonId).single();
      if (salonRow?.plan_type) setPlanType(salonRow.plan_type as "free" | "standard");
      const menusQuery = supabase.from("treatment_menus").select("id, name, category, duration_minutes, price, is_active").eq("salon_id", resolvedSalonId).eq("is_active", true).order("name").returns<Menu[]>();
      const productsQuery = supabase.from("products").select("id, name, category, base_sell_price, base_cost_price").eq("salon_id", resolvedSalonId).eq("is_active", true).order("name").returns<Product[]>();
      const staffQuery = supabase.from("staff").select("id, name").eq("salon_id", resolvedSalonId).eq("is_active", true).order("name");

      if (!presetCustomerId) {
        const customerQuery = supabase.from("customers").select("id, last_name, first_name, last_name_kana, first_name_kana").eq("salon_id", resolvedSalonId).order("last_name_kana", { ascending: true }).returns<CustomerOption[]>();
        const [menuRes, customerRes, productsRes, staffRes] = await Promise.all([menusQuery, customerQuery, productsQuery, staffQuery]);
        setMenus(menuRes.data ?? []); setCustomers(customerRes.data ?? []); setProducts(productsRes.data ?? []);
        if (staffRes.data) { setStaffList(staffRes.data); if (staff) setStaffId(staff.id); }
      } else {
        const customerNameQuery = supabase.from("customers").select("last_name, first_name").eq("id", presetCustomerId).eq("salon_id", resolvedSalonId).single<{ last_name: string; first_name: string }>();
        const [menuRes, customerRes, productsRes, staffRes] = await Promise.all([menusQuery, customerNameQuery, productsQuery, staffQuery]);
        setMenus(menuRes.data ?? []); setProducts(productsRes.data ?? []);
        if (customerRes.data) setCustomerName(`${customerRes.data.last_name} ${customerRes.data.first_name}`);
        if (staffRes.data) { setStaffList(staffRes.data); if (staff) setStaffId(staff.id); }
      }

      if (appointmentParam) {
        const { data: appointmentMenus } = await supabase.from("appointment_menus").select("id, menu_id, sort_order").eq("appointment_id", appointmentParam).order("sort_order").returns<AppointmentMenu[]>();
        if (appointmentMenus && appointmentMenus.length > 0) {
          const ids = appointmentMenus.map((am) => am.menu_id).filter(Boolean) as string[];
          setSelectedMenuIds(ids);
          setMenuPayments(ids.map((menuId) => ({ menuId, paymentType: "cash", ticketId: null, priceOverride: null })));
        }
      }
    };
    load();
  }, [presetCustomerId, appointmentParam]);

  // 予約選択ステップで予約を選んだとき
  const handleAppointmentSelect = async (data: SelectedAppointment) => {
    setLinkedAppointmentId(data.appointmentId);
    setSelectedCustomerId(data.customerId);
    setCustomerName(data.customerName);
    setForm((prev) => ({ ...prev, treatment_date: data.appointmentDate }));
    // 予約メニューをプリフィル
    const supabase = createClient();
    const { data: appointmentMenus } = await supabase.from("appointment_menus").select("id, menu_id, sort_order").eq("appointment_id", data.appointmentId).order("sort_order").returns<AppointmentMenu[]>();
    if (appointmentMenus && appointmentMenus.length > 0) {
      const ids = appointmentMenus.map((am) => am.menu_id).filter(Boolean) as string[];
      setSelectedMenuIds(ids);
      setMenuPayments(ids.map((menuId) => ({ menuId, paymentType: "cash", ticketId: null, priceOverride: null })));
    }
    setAppointmentStepDone(true);
  };

  // 顧客選択後に回数券を取得
  useEffect(() => {
    if (!customerId || !salonId) { setCourseTickets([]); setHasTickets(false); return; }
    const loadTickets = async () => {
      const supabase = createClient();
      const { count } = await supabase.from("course_tickets").select("id", { count: "exact", head: true }).eq("customer_id", customerId).eq("salon_id", salonId).eq("status", "active");
      if (count && count > 0) {
        setHasTickets(true);
        const { data } = await supabase.from("course_tickets").select("id, ticket_name, total_sessions, used_sessions, price, status, memo, expiry_date").eq("customer_id", customerId).eq("salon_id", salonId).eq("status", "active").order("purchase_date", { ascending: false }).returns<CourseTicket[]>();
        const tickets = data ?? [];
        setCourseTickets(tickets);
        // 既にプリフィルされたメニューの支払方法を回数券に自動設定
        if (tickets.length > 0) {
          setMenuPayments((prev) => prev.map((mp) => mp.paymentType === "cash"
            ? { ...mp, paymentType: "ticket" as const, ticketId: tickets.length === 1 ? tickets[0].id : null }
            : mp
          ));
        }
      } else { setHasTickets(false); setCourseTickets([]); }
    };
    loadTickets();
  }, [customerId, salonId]);

  const setFormCb = useCallback((val: typeof form) => setForm(val), []);
  const { clearDraft, draftRestored, dismissDraftBanner } = useFormDraft("record-new", form, setFormCb);
  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleMenu = (menuId: string) => {
    const newIds = selectedMenuIds.includes(menuId) ? selectedMenuIds.filter((id) => id !== menuId) : [...selectedMenuIds, menuId];
    setSelectedMenuIds(newIds);
    if (newIds.includes(menuId) && !menuPayments.find((mp) => mp.menuId === menuId)) {
      const defaultPayment: MenuPaymentInfo = hasTickets
        ? { menuId, paymentType: "ticket", ticketId: courseTickets.length === 1 ? courseTickets[0].id : null, priceOverride: null }
        : { menuId, paymentType: "cash", ticketId: null, priceOverride: null };
      setMenuPayments((prev) => [...prev, defaultPayment]);
    } else if (!newIds.includes(menuId)) {
      setMenuPayments((prev) => prev.filter((mp) => mp.menuId !== menuId));
    }
  };

  const updateMenuPayment = (menuId: string, paymentType: MenuPaymentInfo["paymentType"], ticketId: string | null = null) => {
    setMenuPayments((prev) => prev.map((mp) => mp.menuId === menuId ? { ...mp, paymentType, ticketId: paymentType === "ticket" ? ticketId : null } : mp));
  };
  const updateMenuPrice = (menuId: string, price: number | null) => { setMenuPayments((prev) => prev.map((mp) => mp.menuId === menuId ? { ...mp, priceOverride: price } : mp)); };
  const updateMenuTicket = (menuId: string, ticketId: string) => { setMenuPayments((prev) => prev.map((mp) => mp.menuId === menuId ? { ...mp, ticketId } : mp)); };
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
    if (!customerId) { setError("顧客が選択されていません"); return; }
    if (menuPayments.find((mp) => mp.paymentType === "ticket" && !mp.ticketId)) { setError("回数券支払いのメニューでチケットが選択されていません"); return; }
    setError(""); setLoading(true);

    // フリープラン制限チェック（UIゲートをすり抜けてここに到達した場合の防御）
    if (salonId) {
      const supabase = createClient();
      const [{ data: salon }, { count }] = await Promise.all([
        supabase.from("salons").select("plan_type").eq("id", salonId).single(),
        supabase
          .from("treatment_records")
          .select("id", { count: "exact", head: true })
          .eq("salon_id", salonId),
      ]);
      const { isAtLimit } = await import("@/lib/plan");
      const planType = (salon?.plan_type ?? "free") as "free" | "standard";
      if (isAtLimit(planType, "records", count ?? 0)) {
        setError(
          "おためしプランのカルテ作成上限（100件）に達しました。スタンダードプランにアップグレードしてください。"
        );
        setLoading(false);
        return;
      }
    }

    const result = await submitTreatmentRecord({
      customerId, salonId, staffId, form, menus, selectedMenuIds, menuPayments, pendingTickets, pendingPurchases, photos, appointmentId, courseTickets,
    });

    if (!result.success) { setError(result.error); setLoading(false); return; }
    trackEvent({ name: "first_record" });
    clearDraft();
    if (result.ticketConsumptions && result.ticketConsumptions.length > 0) {
      const info = result.ticketConsumptions.map((tc) => `${tc.ticketName} ${tc.consumed}回消化→残${tc.remaining}回`).join("、");
      setFlashToast(`施術記録を保存しました（${info}）`);
    } else {
      setFlashToast("施術記録を保存しました");
    }
    router.push(`/customers/${customerId}`);
  };

  // 予約選択ステップ（URLパラメータなしの場合）
  if (!appointmentStepDone) {
    return (
      <div className="space-y-4">
        <PageHeader title="施術記録を作成" breadcrumbs={[{ label: "カルテ作成" }]} />
        {salonId ? (
          <AppointmentSelector salonId={salonId} onSelect={handleAppointmentSelect} onSkip={() => setAppointmentStepDone(true)} />
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <p className="text-text-light text-sm">読み込み中...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="施術記録を作成" breadcrumbs={[...(customerName ? [{ label: customerName, href: customerId ? `/customers/${customerId}` : undefined }] : []), { label: "カルテ作成" }]} />

      {presetCustomerId && customerName && <p className="text-text-light">顧客: <span className="font-medium text-text">{customerName}</span></p>}
      {!presetCustomerId && !linkedAppointmentId && <CustomerSelector customers={customers} selectedCustomerId={selectedCustomerId} customerName={customerName} onSelect={(id, name) => { setSelectedCustomerId(id); setCustomerName(name); }} />}
      {!presetCustomerId && linkedAppointmentId && customerName && (
        <p className="text-text-light">顧客: <span className="font-medium text-text">{customerName}</span></p>
      )}

      {draftRestored && (
        <div className="bg-accent/10 text-accent text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>前回の入力内容を復元しました</span>
          <button type="button" onClick={dismissDraftBanner} className="text-xs underline">閉じる</button>
        </div>
      )}

      {customerId && <CourseTicketInfo courseTickets={courseTickets} />}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {error && <ErrorAlert message={error} />}

        <div>
          <label className="block text-sm font-medium mb-1.5">施術日 <span className="text-error">*</span></label>
          <input type="date" value={form.treatment_date} onChange={(e) => updateField("treatment_date", e.target.value)} required className={INPUT_CLASS} />
        </div>

        {staffList.length > 1 && (
          <div>
            <label className="block text-sm font-medium mb-1.5">担当スタッフ</label>
            <select value={staffId ?? ""} onChange={(e) => setStaffId(e.target.value || null)} className={INPUT_CLASS}>
              {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <MenuSelector menus={menus} selectedMenuIds={selectedMenuIds} menuPayments={menuPayments} onToggle={toggleMenu} />
        <PaymentSection menus={menus} selectedMenuIds={selectedMenuIds} menuPayments={menuPayments} courseTickets={courseTickets} hasTickets={hasTickets} onSetAllPaymentType={setAllPaymentType} onSetAllService={setAllService} onUpdatePayment={updateMenuPayment} onUpdatePrice={updateMenuPrice} onUpdateTicket={updateMenuTicket} showCashTotal />

        <div>
          <label className="block text-sm font-medium mb-1.5">施術部位</label>
          <input type="text" value={form.treatment_area} onChange={(e) => updateField("treatment_area", e.target.value)} placeholder="例: 顔全体、デコルテ" className={INPUT_CLASS} />
        </div>

        <CollapsibleSection label={`回数券の新規登録${pendingTickets.length > 0 ? ` — ${pendingTickets.length}件` : ""}`}>
          {pendingTickets.length > 0 && (
            <div className="space-y-2 mb-3">
              {pendingTickets.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-background rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.ticket_name}</p>
                    <p className="text-xs text-text-light">{t.total_sessions}回{t.price ? ` / ${t.price.toLocaleString()}円` : ""}</p>
                  </div>
                  <button type="button" onClick={() => setPendingTickets((prev) => prev.filter((_, idx) => idx !== i))} className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">削除</button>
                </div>
              ))}
            </div>
          )}
          <TicketInlineForm menus={menus} onAdd={(t) => setPendingTickets((prev) => [...prev, t])} />
        </CollapsibleSection>

        <CollapsibleSection label="詳細な記録を追加（任意）">
          <TreatmentDetailFields form={form} onUpdate={updateField} />
        </CollapsibleSection>

        <CollapsibleSection label={`物販記録（任意）${pendingPurchases.length > 0 ? ` — ${pendingPurchases.length}件` : ""}`}>
          {pendingPurchases.length > 0 && (
            <div className="space-y-2 mb-3">
              {pendingPurchases.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-background rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.item_name}</p>
                    <p className="text-xs text-text-light">{p.quantity}個 × {p.unit_price.toLocaleString()}円 = {(p.quantity * p.unit_price).toLocaleString()}円</p>
                  </div>
                  <button type="button" onClick={() => setPendingPurchases((prev) => prev.filter((_, idx) => idx !== i))} className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">削除</button>
                </div>
              ))}
              <div className="flex items-center justify-between bg-accent/5 rounded-xl px-3 py-2">
                <span className="text-xs text-text-light">物販合計</span>
                <span className="text-sm font-bold text-accent">{pendingPurchases.reduce((s, p) => s + p.quantity * p.unit_price, 0).toLocaleString()}円</span>
              </div>
            </div>
          )}
          <PurchaseInlineForm products={products} onAdd={(p) => setPendingPurchases((prev) => [...prev, p])} />
        </CollapsibleSection>

        <PhotoUpload photos={photos} onChange={setPhotos} planType={planType} />

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]">キャンセル</button>
          <SubmitButton loading={loading} className="flex-1" />
        </div>
      </form>
    </div>
  );
}
