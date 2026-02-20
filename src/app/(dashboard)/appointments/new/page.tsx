"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { TimeSlotVisualization } from "@/components/appointments/time-slot-visualization";
import { TimePicker } from "@/components/appointments/time-picker";
import { AppointmentMenuSelector } from "@/components/appointments/appointment-menu-selector";
import { ClosedDayWarning, getOutsideHoursWarning } from "@/components/appointments/business-hours-warning";
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

  // Form state
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: salon } = await supabase
      .from("salons")
      .select("id, business_hours, salon_holidays")
      .eq("owner_id", user.id)
      .single<{ id: string; business_hours: BusinessHours | null; salon_holidays: string[] | null }>();
    if (!salon) return;

    setSalonId(salon.id);
    setBusinessHours(salon.business_hours);
    setSalonHolidays(salon.salon_holidays);

    const [customersRes, menusRes] = await Promise.all([
      supabase
        .from("customers")
        .select("id, last_name, first_name, last_name_kana, first_name_kana")
        .eq("salon_id", salon.id)
        .order("last_name_kana", { ascending: true })
        .returns<Customer[]>(),
      supabase
        .from("treatment_menus")
        .select("id, name, duration_minutes, price, is_active")
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("name")
        .returns<TreatmentMenu[]>(),
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
      const { data } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, customers(last_name, first_name)")
        .eq("salon_id", salonId)
        .eq("appointment_date", appointmentDate)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true })
        .returns<DayAppointment[]>();
      setDayAppointments(data ?? []);
    };
    loadDayAppointments();
  }, [salonId, appointmentDate]);

  // メニュー合計時間から終了時間を自動計算
  const updateEndTimeFromMenus = (menuIds: string[], sH: string, sM: string, forceCalc = false) => {
    if (!forceCalc && isEndTimeManual) return;
    const totalDuration = menuIds.reduce((sum, id) => {
      const menu = menus.find((m) => m.id === id);
      return sum + (menu?.duration_minutes ?? 0);
    }, 0);
    if (totalDuration > 0) {
      const totalMin = Number(sH) * 60 + Number(sM) + totalDuration;
      const rounded = Math.ceil(totalMin / 15) * 15;
      const capped = Math.min(rounded, 23 * 60 + 45);
      setEndHour(String(Math.floor(capped / 60)));
      setEndMinute(String(capped % 60).padStart(2, "0"));
    }
  };

  const toggleMenu = (menuId: string) => {
    const newIds = selectedMenuIds.includes(menuId)
      ? selectedMenuIds.filter((id) => id !== menuId)
      : [...selectedMenuIds, menuId];
    setSelectedMenuIds(newIds);
    setIsEndTimeManual(false);
    updateEndTimeFromMenus(newIds, startHour, startMinute, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerId) {
      setError("顧客を選択してください");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const startTime = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
    const endTime = `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;

    const startMin = Number(startHour) * 60 + Number(startMinute);
    const endMin = Number(endHour) * 60 + Number(endMinute);
    if (endMin <= startMin) {
      setError("終了時間は開始時間より後にしてください");
      setSaving(false);
      return;
    }

    // 重複チェック
    const { data: existing } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, customers(last_name, first_name)")
      .eq("salon_id", salonId)
      .eq("appointment_date", appointmentDate)
      .neq("status", "cancelled");

    if (existing && existing.length > 0) {
      const toMin = (t: string) => {
        const [hh, mm] = t.slice(0, 5).split(":").map(Number);
        return hh * 60 + mm;
      };
      const overlap = existing.find((apt) => {
        const eStart = toMin(apt.start_time);
        const eEnd = apt.end_time ? toMin(apt.end_time) : eStart + 60;
        return startMin < eEnd && eStart < endMin;
      });
      if (overlap) {
        const c = overlap.customers as { last_name: string; first_name: string } | null;
        const name = c ? `${c.last_name} ${c.first_name}` : "別の顧客";
        setError(`この時間帯には既に${name}様の予約があります（${overlap.start_time.slice(0, 5)}〜）`);
        setSaving(false);
        return;
      }
    }

    // メニュースナップショット作成
    const selectedMenusList = selectedMenuIds.map((id, index) => {
      const menu = menus.find((m) => m.id === id);
      return { id, menu, index };
    });
    const menuNameSnapshot = selectedMenusList
      .map(({ menu }) => menu?.name ?? "")
      .filter(Boolean)
      .join("、") || null;

    const { data: inserted, error: insertError } = await supabase
      .from("appointments")
      .insert({
        salon_id: salonId,
        customer_id: customerId,
        menu_id: selectedMenuIds[0] || null,
        menu_name_snapshot: menuNameSnapshot,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        source,
        memo: memo || null,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !inserted) {
      console.error("Appointment insert error:", insertError);
      setError(`予約の登録に失敗しました: ${insertError?.message ?? "不明なエラー"}`);
      setSaving(false);
      return;
    }

    // 中間テーブル挿入
    if (selectedMenuIds.length > 0) {
      const junctionRows = selectedMenusList.map(({ id, menu, index }) => ({
        appointment_id: inserted.id,
        menu_id: id,
        menu_name_snapshot: menu?.name ?? "",
        price_snapshot: menu?.price ?? null,
        duration_minutes_snapshot: menu?.duration_minutes ?? null,
        sort_order: index,
      }));
      const { error: junctionError } = await supabase.from("appointment_menus").insert(junctionRows);
      if (junctionError) console.error("Junction insert error:", junctionError);
    }

    router.push("/appointments");
  };

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return true;
    const s = customerSearch.toLowerCase();
    return (
      `${c.last_name}${c.first_name}`.includes(s) ||
      `${c.last_name_kana ?? ""}${c.first_name_kana ?? ""}`.toLowerCase().includes(s)
    );
  });

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const totalDuration = selectedMenuIds.reduce((sum, id) => {
    const menu = menus.find((m) => m.id === id);
    return sum + (menu?.duration_minutes ?? 0);
  }, 0);
  const totalPrice = selectedMenuIds.reduce((sum, id) => {
    const menu = menus.find((m) => m.id === id);
    return sum + (menu?.price ?? 0);
  }, 0);

  if (loading) {
    return <div className="text-center text-text-light py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="予約を登録"
        backLabel="予約一覧"
        backHref="/appointments"
        breadcrumbs={[
          { label: "予約管理", href: "/appointments" },
          { label: "新規登録" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorAlert message={error} />}

        {/* 顧客選択 */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <label className="block text-sm font-medium">顧客</label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {selectedCustomer.last_name} {selectedCustomer.first_name}
              </span>
              <button type="button" onClick={() => setCustomerId("")} className="text-sm text-text-light hover:text-text">
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
                className={INPUT_CLASS}
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCustomerId(c.id); setCustomerSearch(""); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-background transition-colors"
                  >
                    <p className="font-medium text-sm">{c.last_name} {c.first_name}</p>
                    {(c.last_name_kana || c.first_name_kana) && (
                      <p className="text-xs text-text-light">{c.last_name_kana} {c.first_name_kana}</p>
                    )}
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <p className="text-sm text-text-light text-center py-2">該当する顧客がいません</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* 予約日 */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1.5">予約日</label>
          <input
            id="date"
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            required
            className={INPUT_CLASS}
          />
        </div>

        {/* 休業日警告 */}
        {businessHours && (
          <ClosedDayWarning
            appointmentDate={appointmentDate}
            businessHours={businessHours}
            salonHolidays={salonHolidays}
          />
        )}

        {/* タイムスロット可視化 */}
        {appointmentDate && businessHours && (
          <TimeSlotVisualization
            appointmentDate={appointmentDate}
            businessHours={businessHours}
            salonHolidays={salonHolidays}
            dayAppointments={dayAppointments}
            onSlotClick={(h, m) => {
              setStartHour(String(h));
              setStartMinute(String(m).padStart(2, "0"));
              updateEndTimeFromMenus(selectedMenuIds, String(h), String(m).padStart(2, "0"));
            }}
          />
        )}

        {/* 開始時間 */}
        <TimePicker
          label="開始時間"
          hour={startHour}
          minute={startMinute}
          onHourChange={(h) => { setStartHour(h); updateEndTimeFromMenus(selectedMenuIds, h, startMinute); }}
          onMinuteChange={(m) => { setStartMinute(m); updateEndTimeFromMenus(selectedMenuIds, startHour, m); }}
        />

        {/* 終了時間 */}
        <TimePicker
          label="終了予定時間"
          hour={endHour}
          minute={endMinute}
          onHourChange={(h) => { setEndHour(h); setIsEndTimeManual(true); }}
          onMinuteChange={(m) => { setEndMinute(m); setIsEndTimeManual(true); }}
          autoCalcInfo={{
            isManual: isEndTimeManual,
            hasMenus: selectedMenuIds.length > 0,
            onResetAuto: () => {
              setIsEndTimeManual(false);
              updateEndTimeFromMenus(selectedMenuIds, startHour, startMinute, true);
            },
          }}
          warningMessage={businessHours ? getOutsideHoursWarning({
            appointmentDate, businessHours, salonHolidays,
            startHour, startMinute, endHour, endMinute,
          }) : null}
        />

        {/* メニュー選択 */}
        <AppointmentMenuSelector
          menus={menus}
          selectedMenuIds={selectedMenuIds}
          onToggle={toggleMenu}
          totalDuration={totalDuration}
          totalPrice={totalPrice}
        />

        {/* 任意項目 */}
        <CollapsibleSection label="その他のオプション（任意）">
          <div>
            <label htmlFor="source" className="block text-sm font-medium mb-1.5">予約経路</label>
            <select id="source" value={source} onChange={(e) => setSource(e.target.value)} className={INPUT_CLASS}>
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="memo" className="block text-sm font-medium mb-1.5">メモ</label>
            <AutoResizeTextarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              minRows={2}
              placeholder="施術の要望や注意点など"
              className={INPUT_CLASS}
            />
          </div>
        </CollapsibleSection>

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
