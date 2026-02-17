"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type TreatmentMenu = Database["public"]["Tables"]["treatment_menus"]["Row"];

const SOURCE_OPTIONS = [
  { value: "direct", label: "直接予約" },
  { value: "hotpepper", label: "ホットペッパー" },
  { value: "phone", label: "電話" },
  { value: "line", label: "LINE" },
  { value: "other", label: "その他" },
];

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-light py-8">読み込み中...</div>}>
      <NewAppointmentForm />
    </Suspense>
  );
}

function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customer");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [menus, setMenus] = useState<TreatmentMenu[]>([]);
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [customerId, setCustomerId] = useState(preselectedCustomerId ?? "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [menuId, setMenuId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState("10:00");
  const [source, setSource] = useState("direct");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

    const [customersRes, menusRes] = await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .eq("salon_id", salon.id)
        .order("last_name_kana", { ascending: true })
        .returns<Customer[]>(),
      supabase
        .from("treatment_menus")
        .select("*")
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("name")
        .returns<TreatmentMenu[]>(),
    ]);

    setCustomers(customersRes.data ?? []);
    setMenus(menusRes.data ?? []);
    setLoading(false);
  };

  const selectedMenu = menus.find((m) => m.id === menuId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerId) {
      setError("顧客を選択してください");
      return;
    }

    setSaving(true);

    const supabase = createClient();

    // Calculate end_time from menu duration
    let endTime: string | null = null;
    if (selectedMenu?.duration_minutes) {
      const [h, m] = startTime.split(":").map(Number);
      const totalMin = h * 60 + m + selectedMenu.duration_minutes;
      endTime = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
    }

    const { error } = await supabase.from("appointments").insert({
      salon_id: salonId,
      customer_id: customerId,
      menu_id: menuId || null,
      menu_name_snapshot: selectedMenu?.name ?? null,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime,
      source,
      memo: memo || null,
    });

    if (error) {
      setError("予約の登録に失敗しました");
      setSaving(false);
      return;
    }

    router.push("/appointments");
  };

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return true;
    const s = customerSearch.toLowerCase();
    return (
      `${c.last_name}${c.first_name}`.includes(s) ||
      `${c.last_name_kana ?? ""}${c.first_name_kana ?? ""}`
        .toLowerCase()
        .includes(s)
    );
  });

  const selectedCustomer = customers.find((c) => c.id === customerId);

  if (loading) {
    return (
      <div className="text-center text-text-light py-8">読み込み中...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">予約を登録</h2>
        <Link
          href="/appointments"
          className="text-sm text-text-light hover:text-text transition-colors"
        >
          戻る
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Customer selection */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <label className="block text-sm font-medium">顧客</label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {selectedCustomer.last_name} {selectedCustomer.first_name}
              </span>
              <button
                type="button"
                onClick={() => setCustomerId("")}
                className="text-sm text-text-light hover:text-text"
              >
                変更
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="名前・カナで検索"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomerSearch("");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-background transition-colors"
                  >
                    <p className="font-medium text-sm">
                      {c.last_name} {c.first_name}
                    </p>
                    {(c.last_name_kana || c.first_name_kana) && (
                      <p className="text-xs text-text-light">
                        {c.last_name_kana} {c.first_name_kana}
                      </p>
                    )}
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <p className="text-sm text-text-light text-center py-2">
                    該当する顧客がいません
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Date and time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1.5">
              予約日
            </label>
            <input
              id="date"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium mb-1.5">
              開始時間
            </label>
            <input
              id="time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Menu */}
        <div>
          <label htmlFor="menu" className="block text-sm font-medium mb-1.5">
            施術メニュー（任意）
          </label>
          <select
            id="menu"
            value={menuId}
            onChange={(e) => setMenuId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          >
            <option value="">メニューを選択</option>
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.duration_minutes ? ` (${m.duration_minutes}分)` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium mb-1.5">
            予約経路
          </label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Memo */}
        <div>
          <label htmlFor="memo" className="block text-sm font-medium mb-1.5">
            メモ（任意）
          </label>
          <textarea
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            placeholder="施術の要望や注意点など"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
        >
          {saving ? "登録中..." : "予約を登録"}
        </button>
      </form>
    </div>
  );
}
