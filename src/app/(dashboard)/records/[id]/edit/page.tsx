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

type MenuPaymentInfo = {
  menuId: string;
  paymentType: "cash" | "credit" | "ticket" | "service";
  ticketId: string | null;
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

      // P8: menus + record + record_menus を並列取得
      const [menuRes, recordRes, recordMenusRes] = await Promise.all([
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
      ]);

      setMenus(menuRes.data ?? []);
      const existingMenus = recordMenusRes.data ?? [];
      // existingMenus の復元は以下で処理

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
          setMenuPayments(existingMenus.map((rm) => ({
            menuId: rm.menu_id ?? "",
            paymentType: (rm.payment_type as MenuPaymentInfo["paymentType"]) ?? "cash",
            ticketId: rm.ticket_id,
          })).filter((mp) => mp.menuId));
        } else if (record.menu_id) {
          // 旧データ: menu_idから復元
          setSelectedMenuIds([record.menu_id]);
          setMenuPayments([{ menuId: record.menu_id, paymentType: "cash", ticketId: null }]);
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
      setMenuPayments((prev) => [...prev, { menuId, paymentType: "cash", ticketId: null }]);
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
          price_snapshot: menu?.price ?? null,
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

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  // 合計金額・合計時間
  const totalDuration = selectedMenuIds.reduce((sum, mid) => {
    const menu = menus.find((m) => m.id === mid);
    return sum + (menu?.duration_minutes ?? 0);
  }, 0);
  const totalPrice = selectedMenuIds.reduce((sum, mid) => {
    const menu = menus.find((m) => m.id === mid);
    return sum + (menu?.price ?? 0);
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
                onClick={() => setMenuPayments(selectedMenuIds.map((mid) => ({ menuId: mid, paymentType: "cash", ticketId: null })))}
                className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/5 hover:border-accent hover:text-accent transition-colors"
              >
                全て現金
              </button>
              <button
                type="button"
                onClick={() => setMenuPayments(selectedMenuIds.map((mid) => ({ menuId: mid, paymentType: "credit", ticketId: null })))}
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm flex-1 truncate">{menu.name}</span>
                      <select
                        value={payment?.paymentType ?? "cash"}
                        onChange={(e) => {
                          const pt = e.target.value as MenuPaymentInfo["paymentType"];
                          updateMenuPayment(menuId, pt, pt === "ticket" && courseTickets.length === 1 ? courseTickets[0].id : null);
                        }}
                        className="text-xs rounded-lg border border-border bg-surface px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/50"
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
