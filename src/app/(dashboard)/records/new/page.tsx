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
import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];
type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type CustomerOption = { id: string; last_name: string; first_name: string; last_name_kana: string | null; first_name_kana: string | null };
type AppointmentMenu = Database["public"]["Tables"]["appointment_menus"]["Row"];

// 各メニューの支払情報
type MenuPaymentInfo = {
  menuId: string;
  paymentType: "cash" | "credit" | "ticket" | "service";
  ticketId: string | null;
  priceOverride: number | null; // null = メニュー設定金額を使用
};

// カルテ内の回数券販売（保存前の仮データ）
type PendingTicket = {
  ticket_name: string;
  total_sessions: number;
  price: number | null;
  memo: string;
};

// カルテ内の物販記録（保存前の仮データ）
type PendingPurchase = {
  mode: "product" | "free";
  product_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  memo: string;
};

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
  const [customerSearch, setCustomerSearch] = useState("");
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

  // Derived: the active customer ID (from URL or user selection)
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: salon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", user.id)
        .single<{ id: string }>();
      if (!salon) return;
      setSalonId(salon.id);

      // P7: salon取得後、menus + customers/customerName + products を並列取得
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
          .from("customers")
          .select("id, last_name, first_name, last_name_kana, first_name_kana")
          .eq("salon_id", salon.id)
          .order("last_name_kana", { ascending: true })
          .returns<CustomerOption[]>();

        const [menuRes, customerRes, productsRes] = await Promise.all([menusQuery, customerQuery, productsQuery]);
        setMenus(menuRes.data ?? []);
        setCustomers(customerRes.data ?? []);
        setProducts(productsRes.data ?? []);
      } else {
        const customerNameQuery = supabase
          .from("customers")
          .select("last_name, first_name")
          .eq("id", presetCustomerId)
          .single<{ last_name: string; first_name: string }>();

        const [menuRes, customerRes, productsRes] = await Promise.all([menusQuery, customerNameQuery, productsQuery]);
        setMenus(menuRes.data ?? []);
        setProducts(productsRes.data ?? []);
        if (customerRes.data) {
          setCustomerName(`${customerRes.data.last_name} ${customerRes.data.first_name}`);
        }
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
          // デフォルトは現金支払い
          setMenuPayments(ids.map((menuId) => ({
            menuId,
            paymentType: "cash",
            ticketId: null,
            priceOverride: null,
          })));
        }
      }
    };
    load();
  }, [presetCustomerId, appointmentId]);

  // 条件付きフェッチ: 顧客選択後に回数券の有無を確認
  useEffect(() => {
    if (!customerId || !salonId) {
      setCourseTickets([]);
      setHasTickets(false);
      return;
    }

    const loadTickets = async () => {
      const supabase = createClient();

      // head: true で有無だけ確認（パフォーマンス最適化）
      const { count } = await supabase
        .from("course_tickets")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("salon_id", salonId)
        .eq("status", "active");

      if (count && count > 0) {
        setHasTickets(true);
        // 有効なチケットがある場合のみ詳細取得
        const { data } = await supabase
          .from("course_tickets")
          .select("id, ticket_name, total_sessions, used_sessions, price, status, memo, expiry_date")
          .eq("customer_id", customerId)
          .eq("salon_id", salonId)
          .eq("status", "active")
          .order("purchase_date", { ascending: false })
          .returns<CourseTicket[]>();
        setCourseTickets(data ?? []);
      } else {
        setHasTickets(false);
        setCourseTickets([]);
      }
    };
    loadTickets();
  }, [customerId, salonId]);

  const setFormCb = useCallback((val: typeof form) => setForm(val), []);
  const { clearDraft, draftRestored, dismissDraftBanner } = useFormDraft("record-new", form, setFormCb);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // メニュー選択トグル
  const toggleMenu = (menuId: string) => {
    const newIds = selectedMenuIds.includes(menuId)
      ? selectedMenuIds.filter((id) => id !== menuId)
      : [...selectedMenuIds, menuId];
    setSelectedMenuIds(newIds);

    // 支払情報の同期
    if (newIds.includes(menuId) && !menuPayments.find((mp) => mp.menuId === menuId)) {
      setMenuPayments((prev) => [...prev, { menuId, paymentType: "cash", ticketId: null, priceOverride: null }]);
    } else if (!newIds.includes(menuId)) {
      setMenuPayments((prev) => prev.filter((mp) => mp.menuId !== menuId));
    }
  };

  // メニューの支払方法変更
  const updateMenuPayment = (menuId: string, paymentType: MenuPaymentInfo["paymentType"], ticketId: string | null = null) => {
    setMenuPayments((prev) =>
      prev.map((mp) =>
        mp.menuId === menuId ? { ...mp, paymentType, ticketId: paymentType === "ticket" ? ticketId : null } : mp
      )
    );
  };

  // メニューの金額上書き
  const updateMenuPrice = (menuId: string, price: number | null) => {
    setMenuPayments((prev) =>
      prev.map((mp) =>
        mp.menuId === menuId ? { ...mp, priceOverride: price } : mp
      )
    );
  };

  // メニューの回数券選択
  const updateMenuTicket = (menuId: string, ticketId: string) => {
    setMenuPayments((prev) =>
      prev.map((mp) =>
        mp.menuId === menuId ? { ...mp, ticketId } : mp
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError("顧客が選択されていません");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();

    // 先頭メニューのスナップショット（後方互換用）
    const firstMenuId = selectedMenuIds[0] || null;
    const menuNameSnapshot = selectedMenuIds.length > 0
      ? selectedMenuIds.map((id) => menus.find((m) => m.id === id)?.name).filter(Boolean).join("、")
      : null;

    const { data: record, error: insertError } = await supabase
      .from("treatment_records")
      .insert({
        customer_id: customerId,
        salon_id: salonId,
        treatment_date: form.treatment_date,
        menu_id: firstMenuId,
        menu_name_snapshot: menuNameSnapshot,
        treatment_area: form.treatment_area || null,
        products_used: form.products_used || null,
        skin_condition_before: form.skin_condition_before || null,
        notes_after: form.notes_after || null,
        next_visit_memo: form.next_visit_memo || null,
        conversation_notes: form.conversation_notes || null,
        caution_notes: form.caution_notes || null,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !record) {
      setError("登録に失敗しました");
      setLoading(false);
      return;
    }

    // treatment_record_menus 中間テーブルに複数メニューを挿入
    if (selectedMenuIds.length > 0) {
      const junctionRows = selectedMenuIds.map((menuId, index) => {
        const menu = menus.find((m) => m.id === menuId);
        const payment = menuPayments.find((mp) => mp.menuId === menuId);
        return {
          treatment_record_id: record.id,
          menu_id: menuId,
          menu_name_snapshot: menu?.name ?? "",
          price_snapshot: payment?.priceOverride ?? menu?.price ?? null,
          duration_minutes_snapshot: menu?.duration_minutes ?? null,
          payment_type: payment?.paymentType ?? "cash",
          ticket_id: payment?.ticketId ?? null,
          sort_order: index,
        };
      });

      const { error: junctionError } = await supabase
        .from("treatment_record_menus")
        .insert(junctionRows);

      if (junctionError) {
        console.error("Junction insert error:", junctionError);
      }

      // 回数券消化: ticket支払いのメニューがあれば use_course_ticket_session を呼び出す
      const ticketPayments = menuPayments.filter(
        (mp) => mp.paymentType === "ticket" && mp.ticketId
      );
      for (const tp of ticketPayments) {
        const { error: ticketError } = await supabase.rpc("use_course_ticket_session", {
          p_ticket_id: tp.ticketId!,
        });
        if (ticketError) {
          console.error("Ticket consumption error:", ticketError);
        }
      }
    }

    // Phase 6-2: 回数券販売の保存
    if (pendingTickets.length > 0) {
      const ticketRows = pendingTickets.map((t) => ({
        salon_id: salonId,
        customer_id: customerId,
        ticket_name: t.ticket_name,
        total_sessions: t.total_sessions,
        purchase_date: form.treatment_date,
        price: t.price,
        memo: t.memo || null,
        treatment_record_id: record.id,
      }));
      const { error: ticketInsertError } = await supabase
        .from("course_tickets")
        .insert(ticketRows);
      if (ticketInsertError) {
        console.error("Ticket insert error:", ticketInsertError);
      }
    }

    // Phase 6-2: 物販の保存
    for (const purchase of pendingPurchases) {
      if (purchase.mode === "product" && purchase.product_id) {
        // 商品モード: RPC で在庫連動
        const { error: rpcError } = await supabase.rpc("record_product_sale", {
          p_salon_id: salonId,
          p_customer_id: customerId,
          p_product_id: purchase.product_id,
          p_quantity: purchase.quantity,
          p_sell_price: purchase.unit_price,
          p_purchase_date: form.treatment_date,
          p_memo: purchase.memo || null,
          p_treatment_record_id: record.id,
        });
        if (rpcError) {
          console.error("Product sale RPC error:", rpcError);
        }
      } else {
        // 自由入力モード
        const { error: purchaseError } = await supabase.from("purchases").insert({
          salon_id: salonId,
          customer_id: customerId,
          purchase_date: form.treatment_date,
          item_name: purchase.item_name,
          quantity: purchase.quantity,
          unit_price: purchase.unit_price,
          total_price: purchase.quantity * purchase.unit_price,
          memo: purchase.memo || null,
          treatment_record_id: record.id,
        });
        if (purchaseError) {
          console.error("Purchase insert error:", purchaseError);
        }
      }
    }

    // 写真アップロード
    if (photos.length > 0) {
      const { errors: photoErrors } = await uploadPhotos(
        record.id,
        salonId,
        photos
      );
      if (photoErrors.length > 0) {
        setError(
          "施術記録は保存されましたが、一部の写真のアップロードに失敗しました"
        );
      }
    }

    // Link appointment to treatment record if created from appointment
    if (appointmentId) {
      await supabase
        .from("appointments")
        .update({ treatment_record_id: record.id, status: "completed" })
        .eq("id", appointmentId);
    }

    clearDraft();
    setFlashToast("施術記録を保存しました");
    router.push(`/customers/${customerId}`);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  // Filter customers for search
  const filteredCustomers = customerSearch
    ? customers.filter((c) => {
        const fullName = `${c.last_name}${c.first_name}`;
        const fullKana = `${c.last_name_kana ?? ""}${c.first_name_kana ?? ""}`;
        const q = customerSearch.toLowerCase();
        return fullName.includes(q) || fullKana.includes(q);
      })
    : customers;

  // 合計金額・合計時間
  const totalDuration = selectedMenuIds.reduce((sum, id) => {
    const menu = menus.find((m) => m.id === id);
    return sum + (menu?.duration_minutes ?? 0);
  }, 0);
  const totalPrice = selectedMenuIds.reduce((sum, id) => {
    const menu = menus.find((m) => m.id === id);
    const payment = menuPayments.find((mp) => mp.menuId === id);
    return sum + (payment?.priceOverride ?? menu?.price ?? 0);
  }, 0);

  // 当日支払い金額（回数券・サービスを除く）
  const cashTotal = selectedMenuIds.reduce((sum, id) => {
    const menu = menus.find((m) => m.id === id);
    const payment = menuPayments.find((mp) => mp.menuId === id);
    if (payment?.paymentType === "cash" || payment?.paymentType === "credit") {
      return sum + (payment?.priceOverride ?? menu?.price ?? 0);
    }
    return sum;
  }, 0);

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

      {/* Customer display (when preset from URL) */}
      {presetCustomerId && customerName && (
        <p className="text-text-light">
          顧客: <span className="font-medium text-text">{customerName}</span>
        </p>
      )}

      {/* Customer selector (when NOT preset) */}
      {!presetCustomerId && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <label className="block text-sm font-bold">
            顧客を選択 <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="名前・カナで検索..."
            className={inputClass}
          />
          {customers.length === 0 ? (
            <p className="text-sm text-text-light text-center py-2">
              顧客が登録されていません
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(c.id);
                    setCustomerName(`${c.last_name} ${c.first_name}`);
                    setCustomerSearch("");
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    selectedCustomerId === c.id
                      ? "bg-accent/10 border border-accent text-accent font-medium"
                      : "hover:bg-background border border-transparent"
                  }`}
                >
                  <span>{c.last_name} {c.first_name}</span>
                  {c.last_name_kana && (
                    <span className="text-xs text-text-light ml-2">
                      {c.last_name_kana} {c.first_name_kana}
                    </span>
                  )}
                </button>
              ))}
              {filteredCustomers.length === 0 && customerSearch && (
                <p className="text-sm text-text-light text-center py-2">
                  該当する顧客がいません
                </p>
              )}
            </div>
          )}
          {selectedCustomerId && customerName && (
            <div className="flex items-center gap-2 bg-accent/5 rounded-xl px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-accent shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span className="text-sm font-medium">{customerName}</span>
            </div>
          )}
        </div>
      )}

      {draftRestored && (
        <div className="bg-accent/10 text-accent text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>前回の入力内容を復元しました</span>
          <button type="button" onClick={dismissDraftBanner} className="text-xs underline">閉じる</button>
        </div>
      )}

      {/* 顧客の有効な回数券（情報表示） */}
      {customerId && courseTickets.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-bold">
            有効な回数券（{courseTickets.length}件）
          </h3>
          {courseTickets.map((t) => {
            const remaining = t.total_sessions - t.used_sessions;
            return (
              <div key={t.id} className="flex items-center justify-between">
                <span className="text-sm">{t.ticket_name}</span>
                <span className="text-sm font-bold text-accent">
                  残 {remaining}/{t.total_sessions}回
                </span>
              </div>
            );
          })}
          <p className="text-xs text-text-light">
            支払方法で「回数券」を選ぶと消化できます
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {error && <ErrorAlert message={error} />}

        {/* 施術日 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            施術日 <span className="text-error">*</span>
          </label>
          <input
            type="date"
            value={form.treatment_date}
            onChange={(e) => updateField("treatment_date", e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {/* 施術メニュー（複数選択） */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            施術メニュー（複数選択可）
          </label>
          {menus.length > 0 ? (
            <div className="bg-background border border-border rounded-xl p-3 max-h-64 overflow-y-auto space-y-1">
              {menus.map((m) => {
                const isSelected = selectedMenuIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors cursor-pointer ${
                      isSelected ? "bg-accent/5" : "hover:bg-surface"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMenu(m.id)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
                    />
                    <span className="text-sm flex-1">{m.name}</span>
                    <span className="text-xs text-text-light whitespace-nowrap">
                      {m.duration_minutes ? `${m.duration_minutes}分` : ""}
                      {m.duration_minutes && m.price ? " / " : ""}
                      {m.price ? `${m.price.toLocaleString()}円` : ""}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="bg-background border border-border rounded-xl p-3 text-sm text-text-light text-center">
              メニューが登録されていません
            </div>
          )}
          {selectedMenuIds.length > 0 && (
            <p className="text-xs text-text-light mt-1.5">
              選択中: {selectedMenuIds.length}件
              {totalDuration > 0 && ` / 合計 ${totalDuration}分`}
              {totalPrice > 0 && ` / ${totalPrice.toLocaleString()}円`}
            </p>
          )}
        </div>

        {/* 支払方法（メニュー選択時のみ表示） */}
        {selectedMenuIds.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1.5">支払方法</label>
            {/* 一括設定ボタン */}
            <div className="flex gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setMenuPayments((prev) => selectedMenuIds.map((mid) => {
                  const existing = prev.find((mp) => mp.menuId === mid);
                  return { menuId: mid, paymentType: "cash" as const, ticketId: null, priceOverride: existing?.priceOverride ?? null };
                }))}
                className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/5 hover:border-accent hover:text-accent transition-colors"
              >
                全て現金
              </button>
              <button
                type="button"
                onClick={() => setMenuPayments((prev) => selectedMenuIds.map((mid) => {
                  const existing = prev.find((mp) => mp.menuId === mid);
                  return { menuId: mid, paymentType: "credit" as const, ticketId: null, priceOverride: existing?.priceOverride ?? null };
                }))}
                className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/5 hover:border-accent hover:text-accent transition-colors"
              >
                全てクレジット
              </button>
            </div>
            <div className="bg-background border border-border rounded-xl p-3 space-y-2.5">
              {selectedMenuIds.map((menuId) => {
                const menu = menus.find((m) => m.id === menuId);
                const payment = menuPayments.find((mp) => mp.menuId === menuId);
                if (!menu) return null;
                return (
                  <div key={menuId} className="space-y-1.5">
                    <div className="text-sm font-medium truncate">{menu.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={payment?.priceOverride ?? menu.price ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || val === String(menu.price ?? "")) {
                              updateMenuPrice(menuId, null);
                            } else {
                              updateMenuPrice(menuId, parseInt(val, 10) || 0);
                            }
                          }}
                          className={`w-24 text-sm text-right rounded-lg border bg-surface px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/50 ${
                            payment?.priceOverride != null ? "border-accent text-accent font-medium" : "border-border"
                          }`}
                        />
                        <span className="text-xs text-text-light">円</span>
                      </div>
                      <select
                        value={payment?.paymentType ?? "cash"}
                        onChange={(e) => {
                          const pt = e.target.value as MenuPaymentInfo["paymentType"];
                          updateMenuPayment(menuId, pt, pt === "ticket" && courseTickets.length === 1 ? courseTickets[0].id : null);
                        }}
                        className="text-xs rounded-lg border border-border bg-surface px-2 py-1.5 flex-1 focus:outline-none focus:ring-1 focus:ring-accent/50"
                      >
                        <option value="cash">現金</option>
                        <option value="credit">クレジット</option>
                        {hasTickets && <option value="ticket">回数券</option>}
                        <option value="service">サービス（無料）</option>
                      </select>
                    </div>

                    {/* 回数券選択: 複数チケットの場合のみ表示 */}
                    {payment?.paymentType === "ticket" && courseTickets.length > 1 && (
                      <select
                        value={payment.ticketId ?? ""}
                        onChange={(e) => updateMenuTicket(menuId, e.target.value)}
                        className="text-xs rounded-lg border border-border bg-surface px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-accent/50 ml-0"
                      >
                        <option value="">チケットを選択...</option>
                        {courseTickets.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.ticket_name}（残{t.total_sessions - t.used_sessions}回）
                          </option>
                        ))}
                      </select>
                    )}

                    {/* 回数券が1つの場合: 自動選択の表示 */}
                    {payment?.paymentType === "ticket" && courseTickets.length === 1 && (
                      <p className="text-xs text-accent">
                        {courseTickets[0].ticket_name}（残{courseTickets[0].total_sessions - courseTickets[0].used_sessions}回）
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {cashTotal !== totalPrice && (
              <p className="text-xs text-accent font-medium mt-1.5">
                当日お支払い: {cashTotal.toLocaleString()}円
              </p>
            )}
          </div>
        )}

        {/* 施術部位 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">施術部位</label>
          <input
            type="text"
            value={form.treatment_area}
            onChange={(e) => updateField("treatment_area", e.target.value)}
            placeholder="例: 顔全体、デコルテ"
            className={inputClass}
          />
        </div>

        {/* 任意の詳細項目（折りたたみ） */}
        <CollapsibleSection label="詳細な記録を追加（任意）">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              使用した化粧品・機器
            </label>
            <AutoResizeTextarea
              value={form.products_used}
              onChange={(e) => updateField("products_used", e.target.value)}
              placeholder="使用した化粧品や機器を記録"
              minRows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              施術前の状態
            </label>
            <AutoResizeTextarea
              value={form.skin_condition_before}
              onChange={(e) =>
                updateField("skin_condition_before", e.target.value)
              }
              placeholder="施術前の状態を記録"
              minRows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              施術後の経過メモ
            </label>
            <AutoResizeTextarea
              value={form.notes_after}
              onChange={(e) => updateField("notes_after", e.target.value)}
              placeholder="施術後の状態や経過を記録"
              minRows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              話した内容（会話メモ）
            </label>
            <AutoResizeTextarea
              value={form.conversation_notes}
              onChange={(e) => updateField("conversation_notes", e.target.value)}
              placeholder="お客様との会話で覚えておきたいこと"
              minRows={3}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              注意事項
            </label>
            <AutoResizeTextarea
              value={form.caution_notes}
              onChange={(e) => updateField("caution_notes", e.target.value)}
              placeholder="次回以降に注意すべきこと"
              minRows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              次回への申し送り
            </label>
            <AutoResizeTextarea
              value={form.next_visit_memo}
              onChange={(e) => updateField("next_visit_memo", e.target.value)}
              placeholder="次回施術時の注意点やプランなど"
              minRows={2}
              className={inputClass}
            />
          </div>
        </CollapsibleSection>

        {/* Phase 6-2: 回数券販売セクション */}
        <CollapsibleSection label={`新しい回数券を販売（任意）${pendingTickets.length > 0 ? ` — ${pendingTickets.length}件` : ""}`}>
          {/* 追加済みリスト */}
          {pendingTickets.length > 0 && (
            <div className="space-y-2 mb-3">
              {pendingTickets.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-background rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.ticket_name}</p>
                    <p className="text-xs text-text-light">
                      {t.total_sessions}回{t.price ? ` / ${t.price.toLocaleString()}円` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingTickets((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* 入力フォーム */}
          <TicketInlineForm onAdd={(t) => setPendingTickets((prev) => [...prev, t])} />
        </CollapsibleSection>

        {/* Phase 6-2: 物販記録セクション */}
        <CollapsibleSection label={`物販記録（任意）${pendingPurchases.length > 0 ? ` — ${pendingPurchases.length}件` : ""}`}>
          {/* 追加済みリスト */}
          {pendingPurchases.length > 0 && (
            <div className="space-y-2 mb-3">
              {pendingPurchases.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-background rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.item_name}</p>
                    <p className="text-xs text-text-light">
                      {p.quantity}個 × {p.unit_price.toLocaleString()}円 = {(p.quantity * p.unit_price).toLocaleString()}円
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingPurchases((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    削除
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between bg-accent/5 rounded-xl px-3 py-2">
                <span className="text-xs text-text-light">物販合計</span>
                <span className="text-sm font-bold text-accent">
                  {pendingPurchases.reduce((s, p) => s + p.quantity * p.unit_price, 0).toLocaleString()}円
                </span>
              </div>
            </div>
          )}
          {/* 入力フォーム */}
          <PurchaseInlineForm products={products} onAdd={(p) => setPendingPurchases((prev) => [...prev, p])} />
        </CollapsibleSection>

        {/* Photo upload */}
        <PhotoUpload photos={photos} onChange={setPhotos} />

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}

// 回数券販売のインライン入力フォーム
function TicketInlineForm({ onAdd }: { onAdd: (t: PendingTicket) => void }) {
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState("2");
  const [price, setPrice] = useState("");
  const [memo, setMemo] = useState("");

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      ticket_name: name.trim(),
      total_sessions: Math.max(1, parseInt(sessions, 10) || 1),
      price: price ? parseInt(price, 10) || null : null,
      memo,
    });
    setName("");
    setSessions("2");
    setPrice("");
    setMemo("");
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="チケット名（例: バストメイク2回券）"
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-light mb-1">回数</label>
          <input
            type="number"
            min={1}
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-text-light mb-1">金額（円）</label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>
      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="メモ（任意）"
        className={inputClass}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!name.trim()}
        className="w-full bg-accent/10 text-accent text-sm font-medium rounded-xl py-2.5 hover:bg-accent/20 transition-colors disabled:opacity-50 min-h-[44px]"
      >
        + 回数券を追加
      </button>
    </div>
  );
}

// 物販記録のインライン入力フォーム
function PurchaseInlineForm({ products, onAdd }: { products: Product[]; onAdd: (p: PendingPurchase) => void }) {
  const [mode, setMode] = useState<"product" | "free">(products.length > 0 ? "product" : "free");
  const [productId, setProductId] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [memo, setMemo] = useState("");

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  const handleProductChange = (pid: string) => {
    const product = products.find((p) => p.id === pid);
    setProductId(pid);
    if (product) {
      setItemName(product.name);
      setUnitPrice(product.base_sell_price.toString());
    }
  };

  const handleAdd = () => {
    if (mode === "product" && !productId) return;
    if (mode === "free" && !itemName.trim()) return;
    const q = Math.max(1, parseInt(quantity, 10) || 1);
    const up = Math.max(0, parseInt(unitPrice, 10) || 0);
    onAdd({
      mode,
      product_id: mode === "product" ? productId : null,
      item_name: mode === "product" ? (products.find((p) => p.id === productId)?.name ?? "") : itemName.trim(),
      quantity: q,
      unit_price: up,
      memo,
    });
    setProductId("");
    setItemName("");
    setQuantity("1");
    setUnitPrice("");
    setMemo("");
  };

  const canAdd = mode === "product" ? !!productId : !!itemName.trim();

  return (
    <div className="space-y-3">
      {/* モード切替 */}
      {products.length > 0 && (
        <div className="flex gap-1 bg-background rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => setMode("product")}
            className={`flex-1 text-center text-xs font-medium py-2 rounded-lg transition-colors min-h-[36px] ${
              mode === "product" ? "bg-accent text-white shadow-sm" : "text-text-light hover:text-text"
            }`}
          >
            商品から選ぶ
          </button>
          <button
            type="button"
            onClick={() => setMode("free")}
            className={`flex-1 text-center text-xs font-medium py-2 rounded-lg transition-colors min-h-[36px] ${
              mode === "free" ? "bg-accent text-white shadow-sm" : "text-text-light hover:text-text"
            }`}
          >
            自由入力
          </button>
        </div>
      )}

      {mode === "product" ? (
        <select
          value={productId}
          onChange={(e) => handleProductChange(e.target.value)}
          className={inputClass}
        >
          <option value="">商品を選択</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}{product.category ? ` (${product.category})` : ""} - ¥{product.base_sell_price.toLocaleString()}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="商品名"
          className={inputClass}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-light mb-1">数量</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-text-light mb-1">単価（円）</label>
          <input
            type="number"
            min={0}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      {unitPrice && quantity && (
        <div className="flex items-center justify-between bg-background rounded-xl px-3 py-2">
          <span className="text-xs text-text-light">小計</span>
          <span className="text-sm font-medium">
            {(Math.max(1, parseInt(quantity, 10) || 1) * Math.max(0, parseInt(unitPrice, 10) || 0)).toLocaleString()}円
          </span>
        </div>
      )}

      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="メモ（任意）"
        className={inputClass}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        className="w-full bg-accent/10 text-accent text-sm font-medium rounded-xl py-2.5 hover:bg-accent/20 transition-colors disabled:opacity-50 min-h-[44px]"
      >
        + 物販を追加
      </button>
    </div>
  );
}
