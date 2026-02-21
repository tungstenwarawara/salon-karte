"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadPhotos } from "@/lib/supabase/storage";
import { PhotoUpload, type PhotoEntry } from "@/components/records/photo-upload";
import { PageHeader } from "@/components/layout/page-header";
import { setFlashToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { MenuSelector } from "@/components/records/menu-selector";
import { PaymentSection } from "@/components/records/payment-section";
import { CourseTicketInfo } from "@/components/records/course-ticket-info";
import { CustomerSelector } from "@/components/records/customer-selector";
import { TicketInlineForm } from "@/components/records/ticket-inline-form";
import { PurchaseInlineForm } from "@/components/records/purchase-inline-form";
import { INPUT_CLASS } from "@/components/records/types";
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
  const appointmentId = searchParams.get("appointment");

  const [menus, setMenus] = useState<Menu[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(presetCustomerId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [salonId, setSalonId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  // 複数メニュー選択
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [menuPayments, setMenuPayments] = useState<MenuPaymentInfo[]>([]);

  // 回数券（段階的開示: 顧客選択後に取得）
  const [courseTickets, setCourseTickets] = useState<CourseTicket[]>([]);
  const [hasTickets, setHasTickets] = useState(false);

  // Phase 6-2: カルテ内の物販・回数券販売
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);

  const customerId = presetCustomerId ?? selectedCustomerId;

  const [form, setForm] = useState(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      treatment_date: today,
      treatment_area: "",
      products_used: "",
      skin_condition_before: "",
      notes_after: "",
      next_visit_memo: "",
      conversation_notes: "",
      caution_notes: "",
    };
  });

  // 初期データ読み込み
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: salon } = await supabase
        .from("salons").select("id").eq("owner_id", user.id).single<{ id: string }>();
      if (!salon) return;
      setSalonId(salon.id);

      const menusQuery = supabase
        .from("treatment_menus")
        .select("id, name, category, duration_minutes, price, is_active")
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("name")
        .returns<Menu[]>();

      const productsQuery = supabase
        .from("products")
        .select("id, name, category, base_sell_price, base_cost_price")
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("name")
        .returns<Product[]>();

      if (!presetCustomerId) {
        const customerQuery = supabase
          .from("customers").select("id, last_name, first_name, last_name_kana, first_name_kana")
          .eq("salon_id", salon.id).order("last_name_kana", { ascending: true }).returns<CustomerOption[]>();
        const [menuRes, customerRes, productsRes] = await Promise.all([menusQuery, customerQuery, productsQuery]);
        setMenus(menuRes.data ?? []);
        setCustomers(customerRes.data ?? []);
        setProducts(productsRes.data ?? []);
      } else {
        const customerNameQuery = supabase
          .from("customers").select("last_name, first_name").eq("id", presetCustomerId)
          .single<{ last_name: string; first_name: string }>();
        const [menuRes, customerRes, productsRes] = await Promise.all([menusQuery, customerNameQuery, productsQuery]);
        setMenus(menuRes.data ?? []);
        setProducts(productsRes.data ?? []);
        if (customerRes.data) setCustomerName(`${customerRes.data.last_name} ${customerRes.data.first_name}`);
      }

      // 予約から遷移: appointment_menus を取得してプリセット
      if (appointmentId) {
        const { data: appointmentMenus } = await supabase
          .from("appointment_menus")
          .select("id, menu_id, sort_order")
          .eq("appointment_id", appointmentId)
          .order("sort_order")
          .returns<AppointmentMenu[]>();

        if (appointmentMenus && appointmentMenus.length > 0) {
          const ids = appointmentMenus.map((am) => am.menu_id).filter(Boolean) as string[];
          setSelectedMenuIds(ids);
          setMenuPayments(ids.map((menuId) => ({ menuId, paymentType: "cash", ticketId: null, priceOverride: null })));
        }
      }
    };
    load();
  }, [presetCustomerId, appointmentId]);

  // 条件付きフェッチ: 顧客選択後に回数券の有無を確認
  useEffect(() => {
    if (!customerId || !salonId) { setCourseTickets([]); setHasTickets(false); return; }
    const loadTickets = async () => {
      const supabase = createClient();
      const { count } = await supabase.from("course_tickets").select("id", { count: "exact", head: true })
        .eq("customer_id", customerId).eq("salon_id", salonId).eq("status", "active");
      if (count && count > 0) {
        setHasTickets(true);
        const { data } = await supabase
          .from("course_tickets")
          .select("id, ticket_name, total_sessions, used_sessions, price, status, memo, expiry_date")
          .eq("customer_id", customerId)
          .eq("salon_id", salonId)
          .eq("status", "active")
          .order("purchase_date", { ascending: false })
          .returns<CourseTicket[]>();
        setCourseTickets(data ?? []);
      } else { setHasTickets(false); setCourseTickets([]); }
    };
    loadTickets();
  }, [customerId, salonId]);

  const setFormCb = useCallback((val: typeof form) => setForm(val), []);
  const { clearDraft, draftRestored, dismissDraftBanner } = useFormDraft("record-new", form, setFormCb);

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // メニュー選択トグル
  const toggleMenu = (menuId: string) => {
    const newIds = selectedMenuIds.includes(menuId) ? selectedMenuIds.filter((id) => id !== menuId) : [...selectedMenuIds, menuId];
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
    if (!customerId) { setError("顧客が選択されていません"); return; }
    const unselectedTicket = menuPayments.find((mp) => mp.paymentType === "ticket" && !mp.ticketId);
    if (unselectedTicket) { setError("回数券支払いのメニューでチケットが選択されていません"); return; }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const firstMenuId = selectedMenuIds[0] || null;
    const menuNameSnapshot = selectedMenuIds.length > 0
      ? selectedMenuIds.map((id) => menus.find((m) => m.id === id)?.name).filter(Boolean).join("、") : null;

    const { data: record, error: insertError } = await supabase
      .from("treatment_records")
      .insert({
        customer_id: customerId, salon_id: salonId, treatment_date: form.treatment_date,
        menu_id: firstMenuId, menu_name_snapshot: menuNameSnapshot,
        treatment_area: form.treatment_area || null, products_used: form.products_used || null,
        skin_condition_before: form.skin_condition_before || null, notes_after: form.notes_after || null,
        next_visit_memo: form.next_visit_memo || null, conversation_notes: form.conversation_notes || null,
        caution_notes: form.caution_notes || null,
      })
      .select("id").single<{ id: string }>();

    if (insertError || !record) { setError("登録に失敗しました"); setLoading(false); return; }

    const ticketErrors: string[] = [];

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

      const ticketUseCounts = new Map<string, number>();
      menuPayments.forEach((mp) => {
        if (mp.paymentType === "ticket" && mp.ticketId) ticketUseCounts.set(mp.ticketId, (ticketUseCounts.get(mp.ticketId) ?? 0) + 1);
      });
      for (const [ticketId, count] of ticketUseCounts) {
        for (let i = 0; i < count; i++) {
          const { error: ticketError } = await supabase.rpc("use_course_ticket_session", { p_ticket_id: ticketId });
          if (ticketError) { console.error("Ticket consumption error:", ticketError); ticketErrors.push(`回数券の消化に失敗しました: ${ticketError.message}`); }
        }
      }
    }

    const warnings: string[] = [...ticketErrors];

    if (pendingTickets.length > 0) {
      const ticketRows = pendingTickets.map((t) => ({
        salon_id: salonId, customer_id: customerId, ticket_name: t.ticket_name,
        total_sessions: t.total_sessions, purchase_date: form.treatment_date,
        price: t.price, memo: t.memo || null, treatment_record_id: record.id,
      }));
      const { error: ticketInsertError } = await supabase.from("course_tickets").insert(ticketRows);
      if (ticketInsertError) { console.error("Ticket insert error:", ticketInsertError); warnings.push("回数券の登録に失敗しました"); }
    }

    for (const purchase of pendingPurchases) {
      if (purchase.mode === "product" && purchase.product_id) {
        const { error: rpcError } = await supabase.rpc("record_product_sale", {
          p_salon_id: salonId, p_customer_id: customerId, p_product_id: purchase.product_id,
          p_quantity: purchase.quantity, p_sell_price: purchase.unit_price,
          p_purchase_date: form.treatment_date, p_memo: purchase.memo || null, p_treatment_record_id: record.id,
        });
        if (rpcError) { console.error("Product sale RPC error:", rpcError); warnings.push("物販の在庫連動に失敗しました"); }
      } else {
        const { error: purchaseError } = await supabase.from("purchases").insert({
          salon_id: salonId, customer_id: customerId, purchase_date: form.treatment_date,
          item_name: purchase.item_name, quantity: purchase.quantity, unit_price: purchase.unit_price,
          total_price: purchase.quantity * purchase.unit_price, memo: purchase.memo || null, treatment_record_id: record.id,
        });
        if (purchaseError) { console.error("Purchase insert error:", purchaseError); warnings.push("物販の登録に失敗しました"); }
      }
    }

    if (photos.length > 0) {
      const { errors: photoErrors } = await uploadPhotos(record.id, salonId, photos);
      if (photoErrors.length > 0) warnings.push("一部の写真のアップロードに失敗しました");
    }

    if (appointmentId) {
      await supabase.from("appointments").update({ treatment_record_id: record.id, status: "completed" }).eq("id", appointmentId);
    }

    if (warnings.length > 0) { setError(`施術記録は保存されましたが、以下の問題があります: ${warnings.join("、")}`); setLoading(false); return; }

    clearDraft();
    setFlashToast("施術記録を保存しました");
    router.push(`/customers/${customerId}`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="施術記録を作成"
        backLabel="戻る"
        breadcrumbs={[
          ...(customerName ? [{ label: customerName, href: customerId ? `/customers/${customerId}` : undefined }] : []),
          { label: "カルテ作成" },
        ]}
      />

      {presetCustomerId && customerName && (
        <p className="text-text-light">顧客: <span className="font-medium text-text">{customerName}</span></p>
      )}

      {!presetCustomerId && (
        <CustomerSelector
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          customerName={customerName}
          onSelect={(id, name) => { setSelectedCustomerId(id); setCustomerName(name); }}
        />
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

        <MenuSelector menus={menus} selectedMenuIds={selectedMenuIds} menuPayments={menuPayments} onToggle={toggleMenu} />

        <PaymentSection
          menus={menus} selectedMenuIds={selectedMenuIds} menuPayments={menuPayments}
          courseTickets={courseTickets} hasTickets={hasTickets}
          onSetAllPaymentType={setAllPaymentType} onUpdatePayment={updateMenuPayment}
          onUpdatePrice={updateMenuPrice} onUpdateTicket={updateMenuTicket} showCashTotal
        />

        <div>
          <label className="block text-sm font-medium mb-1.5">施術部位</label>
          <input type="text" value={form.treatment_area} onChange={(e) => updateField("treatment_area", e.target.value)} placeholder="例: 顔全体、デコルテ" className={INPUT_CLASS} />
        </div>

        <CollapsibleSection label="詳細な記録を追加（任意）">
          <div>
            <label className="block text-sm font-medium mb-1.5">使用した化粧品・機器</label>
            <AutoResizeTextarea value={form.products_used} onChange={(e) => updateField("products_used", e.target.value)} placeholder="使用した化粧品や機器を記録" minRows={2} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">施術前の状態</label>
            <AutoResizeTextarea value={form.skin_condition_before} onChange={(e) => updateField("skin_condition_before", e.target.value)} placeholder="施術前の状態を記録" minRows={2} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">施術後の経過メモ</label>
            <AutoResizeTextarea value={form.notes_after} onChange={(e) => updateField("notes_after", e.target.value)} placeholder="施術後の状態や経過を記録" minRows={2} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">話した内容（会話メモ）</label>
            <AutoResizeTextarea value={form.conversation_notes} onChange={(e) => updateField("conversation_notes", e.target.value)} placeholder="お客様との会話で覚えておきたいこと" minRows={3} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">注意事項</label>
            <AutoResizeTextarea value={form.caution_notes} onChange={(e) => updateField("caution_notes", e.target.value)} placeholder="次回以降に注意すべきこと" minRows={2} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">次回への申し送り</label>
            <AutoResizeTextarea value={form.next_visit_memo} onChange={(e) => updateField("next_visit_memo", e.target.value)} placeholder="次回施術時の注意点やプランなど" minRows={2} className={INPUT_CLASS} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection label={`新しい回数券を販売（任意）${pendingTickets.length > 0 ? ` — ${pendingTickets.length}件` : ""}`}>
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

        <PhotoUpload photos={photos} onChange={setPhotos} />

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]">キャンセル</button>
          <button type="submit" disabled={loading} className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]">{loading ? "保存中..." : "保存する"}</button>
        </div>
      </form>
    </div>
  );
}
