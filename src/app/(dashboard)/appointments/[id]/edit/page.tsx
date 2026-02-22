"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { setFlashToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { AppointmentMenuSelector } from "@/components/appointments/appointment-menu-selector";
import { AppointmentDateTimeSection } from "@/components/appointments/appointment-datetime-section";
import { updateAppointment } from "@/components/appointments/appointment-edit-submit";
import { INPUT_CLASS, SOURCE_OPTIONS } from "@/components/appointments/types";
import type { TreatmentMenu, DayAppointment, BusinessHours } from "@/components/appointments/types";
import type { Database } from "@/types/database";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [menus, setMenus] = useState<TreatmentMenu[]>([]);
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [salonHolidays, setSalonHolidays] = useState<string[] | null>(null);
  const [dayAppointments, setDayAppointments] = useState<DayAppointment[]>([]);

  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startHour, setStartHour] = useState("10");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("11");
  const [endMinute, setEndMinute] = useState("00");
  const [isEndTimeManual, setIsEndTimeManual] = useState(false);
  const [source, setSource] = useState("direct");
  const [memo, setMemo] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: salon } = await supabase.from("salons").select("id, business_hours, salon_holidays").eq("owner_id", user.id)
      .single<{ id: string; business_hours: BusinessHours | null; salon_holidays: string[] | null }>();
    if (!salon) { setLoading(false); return; }
    setSalonId(salon.id);
    setBusinessHours(salon.business_hours);
    setSalonHolidays(salon.salon_holidays);

    const [appointmentRes, menuRes, junctionRes] = await Promise.all([
      supabase.from("appointments").select("id, customer_id, appointment_date, start_time, end_time, source, memo, status, customers(last_name, first_name)")
        .eq("id", appointmentId).eq("salon_id", salon.id)
        .single<Appointment & { customers: { last_name: string; first_name: string } | null }>(),
      supabase.from("treatment_menus").select("id, name, category, duration_minutes, price, is_active").eq("salon_id", salon.id).eq("is_active", true).order("name").returns<TreatmentMenu[]>(),
      supabase.from("appointment_menus").select("menu_id").eq("appointment_id", appointmentId).order("sort_order"),
    ]);

    const appointment = appointmentRes.data;
    if (!appointment) { router.push("/appointments"); return; }
    setMenus(menuRes.data ?? []);

    const existingMenus = junctionRes.data;
    if (existingMenus && existingMenus.length > 0) {
      setSelectedMenuIds(existingMenus.map((m) => m.menu_id).filter(Boolean) as string[]);
    } else if (appointment.menu_id) {
      setSelectedMenuIds([appointment.menu_id]);
    }

    setAppointmentDate(appointment.appointment_date);
    const [sH, sM] = appointment.start_time.slice(0, 5).split(":");
    setStartHour(String(Number(sH)));
    setStartMinute(sM);
    if (appointment.end_time) {
      const [eH, eM] = appointment.end_time.slice(0, 5).split(":");
      setEndHour(String(Number(eH)));
      setEndMinute(eM);
    } else {
      setEndHour(String(Number(sH) + 1));
      setEndMinute(sM);
    }
    setSource(appointment.source ?? "direct");
    setMemo(appointment.memo ?? "");
    if (appointment.customers) setCustomerName(`${appointment.customers.last_name} ${appointment.customers.first_name}`);
    setLoading(false);
  };

  // 日付変更時に当日の予約を取得
  useEffect(() => {
    if (!salonId || !appointmentDate) return;
    const loadDayAppointments = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("appointments").select("id, start_time, end_time, customers(last_name, first_name)")
        .eq("salon_id", salonId).eq("appointment_date", appointmentDate).neq("status", "cancelled")
        .order("start_time", { ascending: true }).returns<DayAppointment[]>();
      setDayAppointments(data ?? []);
    };
    loadDayAppointments();
  }, [salonId, appointmentDate]);

  const updateEndTimeFromMenus = (menuIds: string[], sH: string, sM: string, forceCalc = false) => {
    if (!forceCalc && isEndTimeManual) return;
    const totalDuration = menuIds.reduce((sum, id) => sum + (menus.find((m) => m.id === id)?.duration_minutes ?? 0), 0);
    if (totalDuration > 0) {
      const totalMin = Number(sH) * 60 + Number(sM) + totalDuration;
      const rounded = Math.ceil(totalMin / 15) * 15;
      const capped = Math.min(rounded, 23 * 60 + 45);
      setEndHour(String(Math.floor(capped / 60)));
      setEndMinute(String(capped % 60).padStart(2, "0"));
    }
  };

  const toggleMenu = (menuId: string) => {
    const newIds = selectedMenuIds.includes(menuId) ? selectedMenuIds.filter((id) => id !== menuId) : [...selectedMenuIds, menuId];
    setSelectedMenuIds(newIds);
    setIsEndTimeManual(false);
    updateEndTimeFromMenus(newIds, startHour, startMinute, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const result = await updateAppointment({
      appointmentId, salonId, menus, selectedMenuIds,
      appointmentDate, startHour, startMinute, endHour, endMinute, source, memo,
    });
    if (!result.success) { setError(result.error); setSaving(false); return; }
    setFlashToast("予約を更新しました");
    router.push("/appointments");
  };

  const totalDuration = selectedMenuIds.reduce((sum, id) => sum + (menus.find((m) => m.id === id)?.duration_minutes ?? 0), 0);
  const totalPrice = selectedMenuIds.reduce((sum, id) => sum + (menus.find((m) => m.id === id)?.price ?? 0), 0);

  if (loading) return <div className="text-center text-text-light py-8">読み込み中...</div>;

  return (
    <div className="space-y-4">
      <PageHeader title="予約を編集"
        breadcrumbs={[{ label: "予約管理", href: "/appointments" }, { label: "編集" }]} />

      {customerName && <p className="text-text-light">顧客: <span className="font-medium text-text">{customerName}</span></p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorAlert message={error} />}

        <AppointmentDateTimeSection
          appointmentDate={appointmentDate} onDateChange={setAppointmentDate}
          businessHours={businessHours} salonHolidays={salonHolidays} dayAppointments={dayAppointments}
          startHour={startHour} startMinute={startMinute} endHour={endHour} endMinute={endMinute}
          isEndTimeManual={isEndTimeManual} selectedMenuIds={selectedMenuIds}
          excludeAppointmentId={appointmentId}
          onSlotClick={(h, m) => { setStartHour(String(h)); setStartMinute(String(m).padStart(2, "0")); updateEndTimeFromMenus(selectedMenuIds, String(h), String(m).padStart(2, "0")); }}
          onStartHourChange={(h) => { setStartHour(h); updateEndTimeFromMenus(selectedMenuIds, h, startMinute); }}
          onStartMinuteChange={(m) => { setStartMinute(m); updateEndTimeFromMenus(selectedMenuIds, startHour, m); }}
          onEndHourChange={(h) => { setEndHour(h); setIsEndTimeManual(true); }}
          onEndMinuteChange={(m) => { setEndMinute(m); setIsEndTimeManual(true); }}
          onResetAutoEndTime={() => { setIsEndTimeManual(false); updateEndTimeFromMenus(selectedMenuIds, startHour, startMinute, true); }}
        />

        <AppointmentMenuSelector menus={menus} selectedMenuIds={selectedMenuIds} onToggle={toggleMenu} totalDuration={totalDuration} totalPrice={totalPrice} />

        <div>
          <label htmlFor="source" className="block text-sm font-medium mb-1.5">予約経路</label>
          <select id="source" value={source} onChange={(e) => setSource(e.target.value)} className={INPUT_CLASS}>
            {SOURCE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="memo" className="block text-sm font-medium mb-1.5">メモ（任意）</label>
          <AutoResizeTextarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} minRows={2} placeholder="施術の要望や注意点など" className={INPUT_CLASS} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]">キャンセル</button>
          <button type="submit" disabled={saving} className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]">{saving ? "保存中..." : "保存する"}</button>
        </div>
      </form>
    </div>
  );
}
