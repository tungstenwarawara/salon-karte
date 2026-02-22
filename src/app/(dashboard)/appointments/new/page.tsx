"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { setFlashToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { AppointmentMenuSelector } from "@/components/appointments/appointment-menu-selector";
import { AppointmentDateTimeSection } from "@/components/appointments/appointment-datetime-section";
import { submitAppointment } from "@/components/appointments/appointment-form-submit";
import { INPUT_CLASS, SOURCE_OPTIONS } from "@/components/appointments/types";
import type { TreatmentMenu, DayAppointment, BusinessHours } from "@/components/appointments/types";
import type { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

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
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [salonHolidays, setSalonHolidays] = useState<string[] | null>(null);
  const [dayAppointments, setDayAppointments] = useState<DayAppointment[]>([]);

  const [customerId, setCustomerId] = useState(preselectedCustomerId ?? "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
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
    if (!user) return;
    const { data: salon } = await supabase.from("salons").select("id, business_hours, salon_holidays").eq("owner_id", user.id)
      .single<{ id: string; business_hours: BusinessHours | null; salon_holidays: string[] | null }>();
    if (!salon) return;
    setSalonId(salon.id);
    setBusinessHours(salon.business_hours);
    setSalonHolidays(salon.salon_holidays);

    const [customersRes, menusRes] = await Promise.all([
      supabase.from("customers").select("id, last_name, first_name, last_name_kana, first_name_kana").eq("salon_id", salon.id).order("last_name_kana", { ascending: true }).returns<Customer[]>(),
      supabase.from("treatment_menus").select("id, name, duration_minutes, price, is_active").eq("salon_id", salon.id).eq("is_active", true).order("name").returns<TreatmentMenu[]>(),
    ]);
    setCustomers(customersRes.data ?? []);
    setMenus(menusRes.data ?? []);
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
    if (!customerId) { setError("顧客を選択してください"); return; }
    setError(""); setSaving(true);
    const result = await submitAppointment({
      salonId, customerId, menus, selectedMenuIds,
      appointmentDate, startHour, startMinute, endHour, endMinute, source, memo,
    });
    if (!result.success) { setError(result.error); setSaving(false); return; }
    setFlashToast("予約を登録しました");
    router.push("/appointments");
  };

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return true;
    const s = customerSearch.toLowerCase();
    return `${c.last_name}${c.first_name}`.includes(s) || `${c.last_name_kana ?? ""}${c.first_name_kana ?? ""}`.toLowerCase().includes(s);
  });

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const totalDuration = selectedMenuIds.reduce((sum, id) => sum + (menus.find((m) => m.id === id)?.duration_minutes ?? 0), 0);
  const totalPrice = selectedMenuIds.reduce((sum, id) => sum + (menus.find((m) => m.id === id)?.price ?? 0), 0);

  if (loading) return <div className="text-center text-text-light py-8">読み込み中...</div>;

  return (
    <div className="space-y-4">
      <PageHeader title="予約を登録"
        breadcrumbs={[{ label: "予約管理", href: "/appointments" }, { label: "新規登録" }]} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorAlert message={error} />}

        {/* 顧客選択 */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <label className="block text-sm font-medium">顧客</label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between">
              <span className="font-medium">{selectedCustomer.last_name} {selectedCustomer.first_name}</span>
              <button type="button" onClick={() => setCustomerId("")} className="text-sm text-text-light hover:text-text">変更</button>
            </div>
          ) : (
            <>
              <input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="名前・カナで検索" className={INPUT_CLASS} />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredCustomers.map((c) => (
                  <button key={c.id} type="button" onClick={() => { setCustomerId(c.id); setCustomerSearch(""); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-background transition-colors">
                    <p className="font-medium text-sm">{c.last_name} {c.first_name}</p>
                    {(c.last_name_kana || c.first_name_kana) && <p className="text-xs text-text-light">{c.last_name_kana} {c.first_name_kana}</p>}
                  </button>
                ))}
                {filteredCustomers.length === 0 && <p className="text-sm text-text-light text-center py-2">該当する顧客がいません</p>}
              </div>
            </>
          )}
        </div>

        <AppointmentDateTimeSection
          appointmentDate={appointmentDate} onDateChange={setAppointmentDate}
          businessHours={businessHours} salonHolidays={salonHolidays} dayAppointments={dayAppointments}
          startHour={startHour} startMinute={startMinute} endHour={endHour} endMinute={endMinute}
          isEndTimeManual={isEndTimeManual} selectedMenuIds={selectedMenuIds}
          onSlotClick={(h, m) => { setStartHour(String(h)); setStartMinute(String(m).padStart(2, "0")); updateEndTimeFromMenus(selectedMenuIds, String(h), String(m).padStart(2, "0")); }}
          onStartHourChange={(h) => { setStartHour(h); updateEndTimeFromMenus(selectedMenuIds, h, startMinute); }}
          onStartMinuteChange={(m) => { setStartMinute(m); updateEndTimeFromMenus(selectedMenuIds, startHour, m); }}
          onEndHourChange={(h) => { setEndHour(h); setIsEndTimeManual(true); }}
          onEndMinuteChange={(m) => { setEndMinute(m); setIsEndTimeManual(true); }}
          onResetAutoEndTime={() => { setIsEndTimeManual(false); updateEndTimeFromMenus(selectedMenuIds, startHour, startMinute, true); }}
        />

        <AppointmentMenuSelector menus={menus} selectedMenuIds={selectedMenuIds} onToggle={toggleMenu} totalDuration={totalDuration} totalPrice={totalPrice} />

        <CollapsibleSection label="その他のオプション（任意）">
          <div>
            <label htmlFor="source" className="block text-sm font-medium mb-1.5">予約経路</label>
            <select id="source" value={source} onChange={(e) => setSource(e.target.value)} className={INPUT_CLASS}>
              {SOURCE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="memo" className="block text-sm font-medium mb-1.5">メモ</label>
            <AutoResizeTextarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} minRows={2} placeholder="施術の要望や注意点など" className={INPUT_CLASS} />
          </div>
        </CollapsibleSection>

        <button type="submit" disabled={saving}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]">
          {saving ? "保存中..." : "保存する"}
        </button>
      </form>
    </div>
  );
}
