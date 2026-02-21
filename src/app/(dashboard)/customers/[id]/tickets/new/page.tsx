"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { setFlashToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { Database } from "@/types/database";

type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];

export default function NewTicketPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [salonId, setSalonId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [mode, setMode] = useState<"menu" | "free">("menu");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      ticket_name: "",
      total_sessions: "2",
      purchase_date: today,
      expiry_date: "",
      price: "",
      memo: "",
    };
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
      setSalonId(salon.id);

      // 顧客名とメニュー一覧を並列取得
      const [customerRes, menuRes] = await Promise.all([
        supabase
          .from("customers")
          .select("last_name, first_name")
          .eq("id", customerId)
          .single<{ last_name: string; first_name: string }>(),
        supabase
          .from("treatment_menus")
          .select("id, name, category, duration_minutes, price, is_active")
          .eq("salon_id", salon.id)
          .eq("is_active", true)
          .order("name")
          .returns<Menu[]>(),
      ]);

      if (customerRes.data) {
        setCustomerName(`${customerRes.data.last_name} ${customerRes.data.first_name}`);
      }
      const fetchedMenus = menuRes.data ?? [];
      setMenus(fetchedMenus);
      // メニューがない場合は自由入力モードに
      if (fetchedMenus.length === 0) {
        setMode("free");
      }
    };
    load();
  }, [customerId]);

  // メニュー選択時にチケット名と参考金額を自動入力
  const handleMenuChange = (menuId: string) => {
    const menu = menus.find((m) => m.id === menuId);
    setSelectedMenuId(menuId);
    if (menu) {
      const currentSessions = Math.max(1, parseInt(form.total_sessions, 10) || 2);
      setForm((prev) => ({
        ...prev,
        ticket_name: menu.name,
        price: menu.price ? (menu.price * currentSessions).toString() : prev.price,
      }));
    }
  };

  // 回数変更時にメニュー選択モードなら参考金額を再計算
  const handleSessionsChange = (value: string) => {
    setForm((prev) => ({ ...prev, total_sessions: value }));
    if (mode === "menu" && selectedMenuId) {
      const menu = menus.find((m) => m.id === selectedMenuId);
      if (menu?.price) {
        const newSessions = Math.max(1, parseInt(value, 10) || 1);
        setForm((prev) => ({ ...prev, total_sessions: value, price: (menu.price! * newSessions).toString() }));
      }
    }
  };

  const totalSessionsNum = Math.max(1, parseInt(form.total_sessions, 10) || 0);
  const priceNum = Math.max(0, parseInt(form.price, 10) || 0);

  // 定価参考表示用
  const selectedMenu = menus.find((m) => m.id === selectedMenuId);
  const referencePrice = selectedMenu?.price ? selectedMenu.price * totalSessionsNum : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticket_name.trim()) {
      setError("チケット名を入力してください");
      return;
    }
    if (totalSessionsNum < 1) {
      setError("回数は1以上を入力してください");
      return;
    }
    if (!salonId) {
      setError("サロン情報の読み込み中です。しばらくお待ちください。");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("course_tickets")
      .insert({
        salon_id: salonId,
        customer_id: customerId,
        ticket_name: form.ticket_name.trim(),
        total_sessions: totalSessionsNum,
        purchase_date: form.purchase_date,
        expiry_date: form.expiry_date || null,
        price: priceNum || null,
        memo: form.memo || null,
      });

    if (insertError) {
      setError("登録に失敗しました");
      setLoading(false);
      return;
    }

    setFlashToast("回数券を登録しました");
    router.push(`/customers/${customerId}`);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  return (
    <div className="space-y-4">
      <PageHeader
        title="コースチケットを登録"
        backLabel="戻る"
        breadcrumbs={[
          ...(customerName ? [{ label: customerName, href: `/customers/${customerId}` }] : []),
          { label: "回数券登録" },
        ]}
      />
      {customerName && (
        <p className="text-text-light">
          顧客: <span className="font-medium text-text">{customerName}</span>
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-2xl p-5 space-y-4"
      >
        {error && <ErrorAlert message={error} />}

        {/* モード切替（メニューがある場合のみ表示） */}
        {menus.length > 0 && (
          <div className="flex gap-1 bg-background rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setMode("menu")}
              className={`flex-1 text-center text-sm font-medium py-2 rounded-lg transition-colors min-h-[44px] ${
                mode === "menu" ? "bg-accent text-white shadow-sm" : "text-text-light hover:text-text"
              }`}
            >
              メニューから作成
            </button>
            <button
              type="button"
              onClick={() => setMode("free")}
              className={`flex-1 text-center text-sm font-medium py-2 rounded-lg transition-colors min-h-[44px] ${
                mode === "free" ? "bg-accent text-white shadow-sm" : "text-text-light hover:text-text"
              }`}
            >
              自由入力
            </button>
          </div>
        )}

        {/* メニュー選択（メニューモード時） */}
        {mode === "menu" && menus.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1.5">メニュー</label>
            <select
              value={selectedMenuId}
              onChange={(e) => handleMenuChange(e.target.value)}
              className={inputClass}
            >
              <option value="">メニューを選択</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
                  {menu.category ? ` (${menu.category})` : ""}
                  {menu.price ? ` - ¥${menu.price.toLocaleString()}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">
            チケット名 <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={form.ticket_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, ticket_name: e.target.value }))
            }
            placeholder={mode === "menu" ? "メニューを選択すると自動入力されます" : "例: フェイシャル5回コース"}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              回数 <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.total_sessions}
              onChange={(e) => handleSessionsChange(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              金額（円）
            </label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  price: e.target.value,
                }))
              }
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>

        {/* 定価参考表示（メニュー選択時のみ） */}
        {mode === "menu" && referencePrice != null && (
          <div className="flex items-center justify-between bg-background rounded-xl px-3 py-2">
            <span className="text-xs text-text-light">定価参考</span>
            <span className="text-xs text-text-light">
              ¥{(selectedMenu?.price ?? 0).toLocaleString()} × {totalSessionsNum}回 = ¥{referencePrice.toLocaleString()}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">購入日</label>
            <input
              type="date"
              value={form.purchase_date}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  purchase_date: e.target.value,
                }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              有効期限（任意）
            </label>
            <input
              type="date"
              value={form.expiry_date}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  expiry_date: e.target.value,
                }))
              }
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            メモ（任意）
          </label>
          <AutoResizeTextarea
            value={form.memo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, memo: e.target.value }))
            }
            placeholder="備考があれば記入"
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
    </div>
  );
}
