"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];
type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type TreatmentRecordMenu = Database["public"]["Tables"]["treatment_record_menus"]["Row"];
type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

type MenuPaymentInfo = {
  menuId: string;
  paymentType: "cash" | "credit" | "ticket" | "service";
  ticketId: string | null;
  priceOverride: number | null; // null = メニュー設定金額を使用
};

export default function EditRecordPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");

  // 複数メニュー
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [menuPayments, setMenuPayments] = useState<MenuPaymentInfo[]>([]);
  // existingMenus はロード時に選択状態の復元に使用（stateとしては保持不要）

  // 回数券
  const [courseTickets, setCourseTickets] = useState<CourseTicket[]>([]);
  const [hasTickets, setHasTickets] = useState(false);

  // 回数券消化のdiff用: 元の支払い状態を保存（menuId → ticketId）
  const [originalTicketPayments, setOriginalTicketPayments] = useState<Map<string, string>>(new Map());

  // 紐づく物販・回数券販売（Phase 6-3a）
  const [linkedPurchases, setLinkedPurchases] = useState<Purchase[]>([]);
  const [linkedTickets, setLinkedTickets] = useState<CourseTicket[]>([]);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);

  const [form, setForm] = useState({
    treatment_date: "",
    treatment_area: "",
    products_used: "",
    skin_condition_before: "",
    notes_after: "",
    next_visit_memo: "",
    conversation_notes: "",
    caution_notes: "",
  });

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

      // P8: menus + record + record_menus + purchases + tickets を並列取得
      const [menuRes, recordRes, recordMenusRes, purchasesRes, linkedTicketsRes] = await Promise.all([
        supabase
          .from("treatment_menus")
          .select("*")
          .eq("salon_id", salon.id)
          .order("name")
          .returns<Menu[]>(),
        supabase
          .from("treatment_records")
          .select("*")
          .eq("id", id)
          .single<TreatmentRecord>(),
        supabase
          .from("treatment_record_menus")
          .select("*")
          .eq("treatment_record_id", id)
          .order("sort_order")
          .returns<TreatmentRecordMenu[]>(),
        supabase
          .from("purchases")
          .select("*")
          .eq("treatment_record_id", id)
          .order("created_at")
          .returns<Purchase[]>(),
        supabase
          .from("course_tickets")
          .select("*")
          .eq("treatment_record_id", id)
          .order("created_at")
          .returns<CourseTicket[]>(),
      ]);

      setMenus(menuRes.data ?? []);
      setLinkedPurchases(purchasesRes.data ?? []);
      setLinkedTickets(linkedTicketsRes.data ?? []);
      const existingMenus = recordMenusRes.data ?? [];

      const record = recordRes.data;
      if (record) {
        setCustomerId(record.customer_id);
        setForm({
          treatment_date: record.treatment_date,
          treatment_area: record.treatment_area ?? "",
          products_used: record.products_used ?? "",
          skin_condition_before: record.skin_condition_before ?? "",
          notes_after: record.notes_after ?? "",
          next_visit_memo: record.next_visit_memo ?? "",
          conversation_notes: record.conversation_notes ?? "",
          caution_notes: record.caution_notes ?? "",
        });

        // 既存の treatment_record_menus からメニュー選択を復元
        if (existingMenus.length > 0) {
          const ids = existingMenus.map((rm) => rm.menu_id).filter(Boolean) as string[];
          setSelectedMenuIds(ids);
          const allMenus = menuRes.data ?? [];
          setMenuPayments(existingMenus.map((rm) => {
            const currentMenu = allMenus.find((m) => m.id === rm.menu_id);
            // price_snapshotがメニューの現在価格と同じならnull（上書きなし）
            const isOverridden = rm.price_snapshot != null && currentMenu?.price != null && rm.price_snapshot !== currentMenu.price;
            return {
              menuId: rm.menu_id ?? "",
              paymentType: (rm.payment_type as MenuPaymentInfo["paymentType"]) ?? "cash",
              ticketId: rm.ticket_id,
              priceOverride: isOverridden ? rm.price_snapshot : null,
            };
          }).filter((mp) => mp.menuId));

          // 回数券消化diff用: 元の支払い状態を保存
          const origTickets = new Map<string, string>();
          existingMenus.forEach((rm) => {
            if (rm.payment_type === "ticket" && rm.ticket_id && rm.menu_id) {
              origTickets.set(rm.menu_id, rm.ticket_id);
            }
          });
          setOriginalTicketPayments(origTickets);
        } else if (record.menu_id) {
          // 旧データ: menu_idから復元
          setSelectedMenuIds([record.menu_id]);
          setMenuPayments([{ menuId: record.menu_id, paymentType: "cash", ticketId: null, priceOverride: null }]);
        }

        // 回数券を取得
        const { count } = await supabase
          .from("course_tickets")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", record.customer_id)
          .eq("salon_id", salon.id)
          .eq("status", "active");

        if (count && count > 0) {
          setHasTickets(true);
          const { data: tickets } = await supabase
            .from("course_tickets")
            .select("*")
            .eq("customer_id", record.customer_id)
            .eq("salon_id", salon.id)
            .eq("status", "active")
            .order("purchase_date", { ascending: false })
            .returns<CourseTicket[]>();
          setCourseTickets(tickets ?? []);
        }
      }
    };
    load();
  }, [id]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMenu = (menuId: string) => {
    const newIds = selectedMenuIds.includes(menuId)
      ? selectedMenuIds.filter((mid) => mid !== menuId)
      : [...selectedMenuIds, menuId];
    setSelectedMenuIds(newIds);

    if (newIds.includes(menuId) && !menuPayments.find((mp) => mp.menuId === menuId)) {
      setMenuPayments((prev) => [...prev, { menuId, paymentType: "cash", ticketId: null, priceOverride: null }]);
    } else if (!newIds.includes(menuId)) {
      setMenuPayments((prev) => prev.filter((mp) => mp.menuId !== menuId));
    }
  };

  const updateMenuPayment = (menuId: string, paymentType: MenuPaymentInfo["paymentType"], ticketId: string | null = null) => {
    setMenuPayments((prev) =>
      prev.map((mp) =>
        mp.menuId === menuId ? { ...mp, paymentType, ticketId: paymentType === "ticket" ? ticketId : null } : mp
      )
    );
  };

  const updateMenuTicket = (menuId: string, ticketId: string) => {
    setMenuPayments((prev) =>
      prev.map((mp) =>
        mp.menuId === menuId ? { ...mp, ticketId } : mp
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    // 先頭メニューのスナップショット（後方互換用）
    const firstMenuId = selectedMenuIds[0] || null;
    const menuNameSnapshot = selectedMenuIds.length > 0
      ? selectedMenuIds.map((mid) => menus.find((m) => m.id === mid)?.name).filter(Boolean).join("、")
      : null;

    const { error: updateError } = await supabase
      .from("treatment_records")
      .update({
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
      .eq("id", id);

    if (updateError) {
      setError("更新に失敗しました");
      setLoading(false);
      return;
    }

    // treatment_record_menus: delete → re-insert
    await supabase
      .from("treatment_record_menus")
      .delete()
      .eq("treatment_record_id", id);

    if (selectedMenuIds.length > 0) {
      const junctionRows = selectedMenuIds.map((menuId, index) => {
        const menu = menus.find((m) => m.id === menuId);
        const payment = menuPayments.find((mp) => mp.menuId === menuId);
        return {
          treatment_record_id: id,
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
        console.error("Junction re-insert error:", junctionError);
      }
    }

    // 回数券消化のdiff処理
    const newTicketPayments = new Map<string, string>();
    menuPayments.forEach((mp) => {
      if (mp.paymentType === "ticket" && mp.ticketId) {
        newTicketPayments.set(mp.menuId, mp.ticketId);
      }
    });

    // 取り消すべきチケット: 元にあるが新にない、またはticketIdが変わった
    const ticketsToUndo = new Set<string>();
    originalTicketPayments.forEach((oldTicketId, menuId) => {
      const newTicketId = newTicketPayments.get(menuId);
      if (!newTicketId || newTicketId !== oldTicketId) {
        ticketsToUndo.add(oldTicketId);
      }
    });

    // 消化すべきチケット: 新にあるが元にない、またはticketIdが変わった
    const ticketsToUse = new Set<string>();
    newTicketPayments.forEach((newTicketId, menuId) => {
      const oldTicketId = originalTicketPayments.get(menuId);
      if (!oldTicketId || oldTicketId !== newTicketId) {
        ticketsToUse.add(newTicketId);
      }
    });

    // 取り消し実行
    for (const ticketId of ticketsToUndo) {
      const { error: undoError } = await supabase.rpc("undo_course_ticket_session", {
        p_ticket_id: ticketId,
      });
      if (undoError) console.error("Ticket undo error:", undoError);
    }

    // 消化実行
    for (const ticketId of ticketsToUse) {
      const { error: useError } = await supabase.rpc("use_course_ticket_session", {
        p_ticket_id: ticketId,
      });
      if (useError) console.error("Ticket consumption error:", useError);
    }

    router.push(`/records/${id}`);
  };

  const handleDelete = async () => {
    if (!confirm("この施術記録を削除しますか？")) return;
    setDeleting(true);

    const supabase = createClient();

    // Clean up storage files for associated photos
    const { data: photos } = await supabase
      .from("treatment_photos")
      .select("storage_path")
      .eq("treatment_record_id", id);

    if (photos && photos.length > 0) {
      const paths = photos.map((p) => p.storage_path);
      await supabase.storage.from("treatment-photos").remove(paths);
    }

    // 削除前に回数券消化を取り消す
    const { data: recordMenusToUndo } = await supabase
      .from("treatment_record_menus")
      .select("ticket_id")
      .eq("treatment_record_id", id)
      .eq("payment_type", "ticket")
      .not("ticket_id", "is", null);

    if (recordMenusToUndo) {
      for (const rm of recordMenusToUndo) {
        if (rm.ticket_id) {
          const { error: undoErr } = await supabase.rpc("undo_course_ticket_session", {
            p_ticket_id: rm.ticket_id,
          });
          if (undoErr) console.error("Ticket undo on delete error:", undoErr);
        }
      }
    }

    const { error } = await supabase
      .from("treatment_records")
      .delete()
      .eq("id", id);

    if (error) {
      setError("削除に失敗しました");
      setDeleting(false);
      return;
    }

    router.push(customerId ? `/customers/${customerId}` : "/dashboard");
  };

  // 物販の削除
  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm("この物販記録を削除しますか？")) return;
    setDeletingPurchaseId(purchaseId);
    const supabase = createClient();

    const purchase = linkedPurchases.find((p) => p.id === purchaseId);

    if (purchase?.product_id) {
      // 在庫連動あり: RPC で削除 + 在庫戻し
      const { error: rpcError } = await supabase.rpc("reverse_product_sale", {
        p_purchase_id: purchaseId,
      });
      if (rpcError) {
        setError("物販の削除に失敗しました");
        setDeletingPurchaseId(null);
        return;
      }
    } else {
      // 自由入力の物販: 直接削除
      const { error: delError } = await supabase.from("purchases").delete().eq("id", purchaseId);
      if (delError) {
        setError("物販の削除に失敗しました");
        setDeletingPurchaseId(null);
        return;
      }
    }

    setLinkedPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
    setDeletingPurchaseId(null);
  };

  // 回数券販売の削除
  const handleDeleteLinkedTicket = async (ticketId: string) => {
    if (!confirm("この回数券を削除しますか？")) return;
    setDeletingTicketId(ticketId);
    const supabase = createClient();

    const { error: delError } = await supabase.from("course_tickets").delete().eq("id", ticketId);
    if (delError) {
      setError("回数券の削除に失敗しました");
      setDeletingTicketId(null);
      return;
    }

    setLinkedTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setDeletingTicketId(null);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  // 合計金額・合計時間
  const totalDuration = selectedMenuIds.reduce((sum, mid) => {
    const menu = menus.find((m) => m.id === mid);
    return sum + (menu?.duration_minutes ?? 0);
  }, 0);
  const totalPrice = selectedMenuIds.reduce((sum, mid) => {
    const menu = menus.find((m) => m.id === mid);
    const payment = menuPayments.find((mp) => mp.menuId === mid);
    return sum + (payment?.priceOverride ?? menu?.price ?? 0);
  }, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="施術記録を編集"
        backLabel="戻る"
        breadcrumbs={[
          { label: "カルテ編集" },
        ]}
      />

      {/* 顧客の有効な回数券（情報表示） */}
      {courseTickets.length > 0 && (
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
                    <span className="text-sm flex-1">
                      {m.name}{!m.is_active ? "（非アクティブ）" : ""}
                    </span>
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

                    {payment?.paymentType === "ticket" && courseTickets.length > 1 && (
                      <select
                        value={payment.ticketId ?? ""}
                        onChange={(e) => updateMenuTicket(menuId, e.target.value)}
                        className="text-xs rounded-lg border border-border bg-surface px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-accent/50"
                      >
                        <option value="">チケットを選択...</option>
                        {courseTickets.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.ticket_name}（残{t.total_sessions - t.used_sessions}回）
                          </option>
                        ))}
                      </select>
                    )}

                    {payment?.paymentType === "ticket" && courseTickets.length === 1 && (
                      <p className="text-xs text-accent">
                        {courseTickets[0].ticket_name}（残{courseTickets[0].total_sessions - courseTickets[0].used_sessions}回）
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">施術部位</label>
          <input
            type="text"
            value={form.treatment_area}
            onChange={(e) => updateField("treatment_area", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            使用した化粧品・機器
          </label>
          <AutoResizeTextarea
            value={form.products_used}
            onChange={(e) => updateField("products_used", e.target.value)}
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
            minRows={2}
            className={inputClass}
          />
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
                    <p className="text-xs text-text-light">
                      {ticket.total_sessions}回{ticket.price != null ? ` / ${ticket.price.toLocaleString()}円` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteLinkedTicket(ticket.id)}
                    disabled={deletingTicketId === ticket.id}
                    className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                  >
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
                  <button
                    type="button"
                    onClick={() => handleDeletePurchase(purchase.id)}
                    disabled={deletingPurchaseId === purchase.id}
                    className="text-error text-xs ml-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                  >
                    {deletingPurchaseId === purchase.id ? "削除中..." : "削除"}
                  </button>
                </div>
              ))}
              {linkedPurchases.length > 1 && (
                <div className="flex items-center justify-between bg-accent/5 rounded-xl px-3 py-2">
                  <span className="text-xs text-text-light">合計</span>
                  <span className="text-sm font-bold text-accent">
                    {linkedPurchases.reduce((s, p) => s + p.total_price, 0).toLocaleString()}円
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

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

      {/* Delete */}
      <div className="bg-surface border border-error/20 rounded-2xl p-5">
        <h3 className="font-bold text-sm text-error mb-2">危険な操作</h3>
        <p className="text-sm text-text-light mb-3">
          この施術記録を削除します。この操作は取り消せません。
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-error/10 text-error text-sm font-medium rounded-xl px-4 py-2 hover:bg-error/20 transition-colors disabled:opacity-50 min-h-[40px]"
        >
          {deleting ? "削除中..." : "この記録を削除"}
        </button>
      </div>
    </div>
  );
}
