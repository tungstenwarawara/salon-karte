"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { Database, BusinessHours } from "@/types/database";
import {
  getScheduleForDate,
  isBusinessDay,
  isWithinBusinessHours,
  isIrregularHoliday,
  timeToMinutes,
} from "@/lib/business-hours";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type TreatmentMenu = Database["public"]["Tables"]["treatment_menus"]["Row"];
type DayAppointment = {
  id: string;
  start_time: string;
  end_time: string | null;
  customers: { last_name: string; first_name: string } | null;
};

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: salon } = await supabase
      .from("salons")
      .select("id, business_hours, salon_holidays")
      .eq("owner_id", user.id)
      .single<{ id: string; business_hours: BusinessHours | null; salon_holidays: string[] | null }>();
    if (!salon) {
      setLoading(false);
      return;
    }
    setSalonId(salon.id);
    setBusinessHours(salon.business_hours);
    setSalonHolidays(salon.salon_holidays);

    // P5: salon取得後、appointment + menus + junction を並列取得
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
    if (!appointment) {
      router.push("/appointments");
      return;
    }

    setMenus(menuRes.data ?? []);

    const existingMenus = junctionRes.data;
    if (existingMenus && existingMenus.length > 0) {
      setSelectedMenuIds(
        existingMenus.map((m) => m.menu_id).filter(Boolean) as string[]
      );
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

  // Fetch day appointments when date changes
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

  // Auto-calculate end time from selected menus' total duration
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

    // Validate end > start
    const startMin = Number(startHour) * 60 + Number(startMinute);
    const endMin = Number(endHour) * 60 + Number(endMinute);
    if (endMin <= startMin) {
      setError("終了時間は開始時間より後にしてください");
      setSaving(false);
      return;
    }

    // Check for overlapping appointments (exclude current)
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

    // Build menu snapshot
    const selectedMenusList = selectedMenuIds.map((id, index) => {
      const menu = menus.find((m) => m.id === id);
      return { id, menu, index };
    });
    const menuNameSnapshot = selectedMenusList
      .map(({ menu }) => menu?.name ?? "")
      .filter(Boolean)
      .join("、") || null;

    // Update appointment
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

    // Update junction table: delete old, insert new
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

  // Calculate total duration and price
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

        {/* Date */}
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
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        {/* Closed day warning */}
        {appointmentDate && businessHours && !isBusinessDay(businessHours, appointmentDate, salonHolidays) && (
          <div className="bg-warning/10 text-warning text-sm rounded-lg p-3">
            {isIrregularHoliday(salonHolidays, appointmentDate)
              ? "この日は臨時休業日に設定されています"
              : "この日は休業日に設定されています"}
          </div>
        )}

        {/* Time slot visualization */}
        {appointmentDate && businessHours && (() => {
          const schedule = getScheduleForDate(businessHours, appointmentDate, salonHolidays);
          if (!schedule.is_open) return null;
          const openMin = timeToMinutes(schedule.open_time);
          const closeMin = timeToMinutes(schedule.close_time);
          const slotCount = (closeMin - openMin) / 15;
          if (slotCount <= 0) return null;
          // Exclude current appointment from occupied slots
          const otherAppointments = dayAppointments.filter((a) => a.id !== appointmentId);

          return (
            <div className="space-y-2">
              <p className="text-xs text-text-light">
                営業時間: {schedule.open_time} 〜 {schedule.close_time}
              </p>
              <div className="overflow-x-auto -mx-1 px-1">
                {/* Time labels row */}
                <div className="flex gap-0.5 mb-1" style={{ minWidth: `${slotCount * 20}px` }}>
                  {Array.from({ length: slotCount }, (_, i) => {
                    const slotMin = openMin + i * 15;
                    const isHourMark = slotMin % 60 === 0;
                    return (
                      <div key={slotMin} className="flex-shrink-0 text-center" style={{ width: "20px" }}>
                        {isHourMark && (
                          <span className="text-[10px] text-text-light">
                            {Math.floor(slotMin / 60)}:00
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Slot buttons row */}
                <div className="flex gap-0.5" style={{ minWidth: `${slotCount * 20}px` }}>
                  {Array.from({ length: slotCount }, (_, i) => {
                    const slotMin = openMin + i * 15;
                    const slotTime = `${String(Math.floor(slotMin / 60)).padStart(2, "0")}:${String(slotMin % 60).padStart(2, "0")}`;
                    const isOccupied = otherAppointments.some((apt) => {
                      const aStart = timeToMinutes(apt.start_time.slice(0, 5));
                      const aEnd = apt.end_time ? timeToMinutes(apt.end_time.slice(0, 5)) : aStart + 60;
                      return slotMin >= aStart && slotMin < aEnd;
                    });
                    const occupyingApt = isOccupied
                      ? otherAppointments.find((apt) => {
                          const aStart = timeToMinutes(apt.start_time.slice(0, 5));
                          const aEnd = apt.end_time ? timeToMinutes(apt.end_time.slice(0, 5)) : aStart + 60;
                          return slotMin >= aStart && slotMin < aEnd;
                        })
                      : null;

                    return (
                      <button
                        key={slotMin}
                        type="button"
                        title={
                          isOccupied && occupyingApt?.customers
                            ? `${slotTime} - ${occupyingApt.customers.last_name} ${occupyingApt.customers.first_name}様`
                            : slotTime
                        }
                        onClick={() => {
                          if (!isOccupied) {
                            const h = Math.floor(slotMin / 60);
                            const m = slotMin % 60;
                            setStartHour(String(h));
                            setStartMinute(String(m).padStart(2, "0"));
                            updateEndTimeFromMenus(selectedMenuIds, String(h), String(m).padStart(2, "0"));
                          }
                        }}
                        className={`h-8 flex-shrink-0 rounded-sm transition-colors ${
                          isOccupied
                            ? "bg-accent/30 cursor-not-allowed"
                            : "bg-accent/10 hover:bg-accent/20 cursor-pointer"
                        }`}
                        style={{ width: "20px" }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-text-light">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-accent/30" />
                  予約あり
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-accent/10" />
                  空き
                </span>
              </div>
            </div>
          );
        })()}

        {/* Start time */}
        <div>
          <label className="block text-sm font-medium mb-1.5">開始時間</label>
          <div className="flex items-center gap-2">
            <select
              value={startHour}
              onChange={(e) => {
                setStartHour(e.target.value);
                updateEndTimeFromMenus(selectedMenuIds, e.target.value, startMinute);
              }}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={String(i)}>{String(i).padStart(2, "0")}</option>
              ))}
            </select>
            <span className="text-lg font-medium">:</span>
            <select
              value={startMinute}
              onChange={(e) => {
                setStartMinute(e.target.value);
                updateEndTimeFromMenus(selectedMenuIds, startHour, e.target.value);
              }}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            >
              {["00", "15", "30", "45"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* End time */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium">終了予定時間</label>
            {selectedMenuIds.length > 0 && (
              <span className={`text-xs ${isEndTimeManual ? "text-orange-500" : "text-accent"}`}>
                {isEndTimeManual ? "手動設定" : "メニューから自動計算"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={endHour}
              onChange={(e) => {
                setEndHour(e.target.value);
                setIsEndTimeManual(true);
              }}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={String(i)}>{String(i).padStart(2, "0")}</option>
              ))}
            </select>
            <span className="text-lg font-medium">:</span>
            <select
              value={endMinute}
              onChange={(e) => {
                setEndMinute(e.target.value);
                setIsEndTimeManual(true);
              }}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            >
              {["00", "15", "30", "45"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          {isEndTimeManual && selectedMenuIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsEndTimeManual(false);
                updateEndTimeFromMenus(selectedMenuIds, startHour, startMinute, true);
              }}
              className="text-xs text-accent hover:underline mt-1"
            >
              自動計算に戻す
            </button>
          )}
          {businessHours && appointmentDate && isBusinessDay(businessHours, appointmentDate, salonHolidays) &&
            !isWithinBusinessHours(
              businessHours,
              appointmentDate,
              `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`,
              `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`,
              salonHolidays
            ) && (() => {
              const schedule = getScheduleForDate(businessHours, appointmentDate, salonHolidays);
              const startStr = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}`;
              const endStr = `${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}`;
              const isBefore = startStr < schedule.open_time;
              const isAfter = endStr > schedule.close_time;
              return (
                <p className="text-xs text-warning mt-1">
                  {isBefore && isAfter
                    ? `開始（${startStr}）が営業開始（${schedule.open_time}）より前、終了（${endStr}）が営業終了（${schedule.close_time}）より後です`
                    : isBefore
                      ? `開始時間（${startStr}）が営業開始（${schedule.open_time}）より前です`
                      : `終了時間（${endStr}）が営業終了（${schedule.close_time}）を超えています`
                  }
                </p>
              );
            })()}
        </div>

        {/* Menu multi-select */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            施術メニュー（任意・複数選択可）
          </label>
          {menus.length > 0 ? (
            <div className="bg-surface border border-border rounded-xl p-3 max-h-52 overflow-y-auto space-y-1">
              {menus.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-background transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMenuIds.includes(m.id)}
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
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-3 text-sm text-text-light text-center">
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

        {/* Source */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium mb-1.5">
            予約経路
          </label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
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
          <AutoResizeTextarea
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            minRows={2}
            placeholder="施術の要望や注意点など"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
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
