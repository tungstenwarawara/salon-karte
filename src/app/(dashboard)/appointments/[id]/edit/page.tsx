"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type TreatmentMenu = Database["public"]["Tables"]["treatment_menus"]["Row"];

const SOURCE_OPTIONS = [
  { value: "direct", label: "直接予約" },
  { value: "hotpepper", label: "ホットペッパー" },
  { value: "phone", label: "電話" },
  { value: "line", label: "LINE" },
  { value: "other", label: "その他" },
];

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [menus, setMenus] = useState<TreatmentMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Form state
  const [menuId, setMenuId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("");
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

    // Load appointment
    const { data: appointment } = await supabase
      .from("appointments")
      .select("*, customers(last_name, first_name)")
      .eq("id", appointmentId)
      .single<Appointment & { customers: { last_name: string; first_name: string } | null }>();

    if (!appointment) {
      router.push("/appointments");
      return;
    }

    // Load menus
    const { data: menuData } = await supabase
      .from("treatment_menus")
      .select("*")
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .order("name")
      .returns<TreatmentMenu[]>();

    setMenus(menuData ?? []);
    setMenuId(appointment.menu_id ?? "");
    setAppointmentDate(appointment.appointment_date);
    setStartTime(appointment.start_time.slice(0, 5));
    setSource(appointment.source ?? "direct");
    setMemo(appointment.memo ?? "");
    if (appointment.customers) {
      setCustomerName(`${appointment.customers.last_name} ${appointment.customers.first_name}`);
    }
    setLoading(false);
  };

  const selectedMenu = menus.find((m) => m.id === menuId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const supabase = createClient();

    // Calculate end_time from menu duration (cap at 23:59)
    let endTime: string | null = null;
    if (selectedMenu?.duration_minutes) {
      const [h, m] = startTime.split(":").map(Number);
      const totalMin = Math.min(h * 60 + m + selectedMenu.duration_minutes, 23 * 60 + 59);
      endTime = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        menu_id: menuId || null,
        menu_name_snapshot: selectedMenu?.name ?? null,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        source,
        memo: memo || null,
      })
      .eq("id", appointmentId);

    if (error) {
      setError("予約の更新に失敗しました");
      setSaving(false);
      return;
    }

    router.push("/appointments");
  };

  if (loading) {
    return <div className="text-center text-text-light py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">予約を編集</h2>
        <Link
          href="/appointments"
          className="text-sm text-text-light hover:text-text transition-colors"
        >
          戻る
        </Link>
      </div>

      {customerName && (
        <p className="text-text-light">
          顧客: <span className="font-medium text-text">{customerName}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}

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
            disabled={saving}
            className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {saving ? "更新中..." : "更新する"}
          </button>
        </div>
      </form>
    </div>
  );
}
