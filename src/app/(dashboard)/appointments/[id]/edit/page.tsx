"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { TimeSlotVisualization } from "@/components/appointments/time-slot-visualization";
import { TimePicker } from "@/components/appointments/time-picker";
import { AppointmentMenuSelector } from "@/components/appointments/appointment-menu-selector";
import { ClosedDayWarning, getOutsideHoursWarning } from "@/components/appointments/business-hours-warning";
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

  // Form state
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState("");
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
    if (!user) { setLoading(false); return; }

    const { data: salon } = await supabase
      .from("salons")
      .select("id, business_hours, salon_holidays")
      .eq("owner_id", user.id)
      .single<{ id: string; business_hours: BusinessHours | null; salon_holidays: string[] | null }>();
    if (!salon) { setLoading(false); return; }
    setSalonId(salon.id);
    setBusinessHours(salon.business_hours);
    setSalonHolidays(salon.salon_holidays);

    const [appointmentRes, menuRes, junctionRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("*, customers(last_name, first_name)")
        .eq("id", appointmentId)
        .eq("salon_id", salon.id)
        .single<Appointment & { customers: { last_name: string; first_name: string } | null }>(),
      supabase
        .from("treatment_menus")
        .select("*")
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("name")
        .returns<TreatmentMenu[]>(),
      supabase
        .from("appointment_menus")
        .select("menu_id")
        .eq("appointment_id", appointmentId)
        .order("sort_order"),
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
    if (appointment.customers) {
      setCustomerName(`${appointment.customers.last_name} ${appointment.customers.first_name}`);
    }
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

    // 重複チェック（自分自身を除外）
    const { data: existing } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, customers(last_name, first_name)")
      .eq("salon_id", salonId)
      .eq("appointment_date", appointmentDate)
      .neq("status", "cancelled")
      .neq("id", appointmentId);

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

    // メニュースナップショット
    const selectedMenusList = selectedMenuIds.map((id, index) => {
      const menu = menus.find((m) => m.id === id);
      return { id, menu, index };
    });
    const menuNameSnapshot = selectedMenusList
      .map(({ menu }) => menu?.name ?? "")
      .filter(Boolean)
      .join("、") || null;

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        menu_id: selectedMenuIds[0] || null,
        menu_name_snapshot: menuNameSnapshot,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        source,
        memo: memo || null,
      })
      .eq("id", appointmentId)
      .eq("salon_id", salonId);

    if (updateError) {
      console.error("Appointment update error:", updateError);
      setError(`予約の更新に失敗しました: ${updateError.message}`);
      setSaving(false);
      return;
    }

    // 中間テーブル更新: 旧レコード削除 → 新規挿入
    const { error: deleteError } = await supabase
      .from("appointment_menus")
      .delete()
      .eq("appointment_id", appointmentId);

    if (deleteError) {
      console.error("Junction delete error:", deleteError);
      setError(`メニュー情報の更新に失敗しました: ${deleteError.message}`);
      setSaving(false);
      return;
    }

    if (selectedMenuIds.length > 0) {
      const junctionRows = selectedMenusList.map(({ id, menu, index }) => ({
        appointment_id: appointmentId,
        menu_id: id,
        menu_name_snapshot: menu?.name ?? "",
        price_snapshot: menu?.price ?? null,
        duration_minutes_snapshot: menu?.duration_minutes ?? null,
        sort_order: index,
      }));
      const { error: junctionError } = await supabase.from("appointment_menus").insert(junctionRows);
      if (junctionError) {
        console.error("Junction insert error:", junctionError);
        setError(`メニュー情報の保存に失敗しました: ${junctionError.message}`);
        setSaving(false);
        return;
      }
    }

    router.push("/appointments");
  };

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
        title="予約を編集"
        backLabel="予約一覧"
        backHref="/appointments"
        breadcrumbs={[
          { label: "予約管理", href: "/appointments" },
          { label: "編集" },
        ]}
      />

      {customerName && (
        <p className="text-text-light">
          顧客: <span className="font-medium text-text">{customerName}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorAlert message={error} />}

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
            excludeAppointmentId={appointmentId}
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

        {/* 予約経路 */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium mb-1.5">予約経路</label>
          <select id="source" value={source} onChange={(e) => setSource(e.target.value)} className={INPUT_CLASS}>
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* メモ */}
        <div>
          <label htmlFor="memo" className="block text-sm font-medium mb-1.5">メモ（任意）</label>
          <AutoResizeTextarea
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            minRows={2}
            placeholder="施術の要望や注意点など"
            className={INPUT_CLASS}
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
