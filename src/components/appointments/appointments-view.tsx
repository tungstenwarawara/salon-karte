"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { BusinessHours } from "@/types/database";
import { getScheduleForDate, isBusinessDay, isIrregularHoliday } from "@/lib/business-hours";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import type { AppointmentWithCustomer } from "@/components/appointments/appointment-card";
import { AppointmentsCalendar, toDateStr, DAY_NAMES } from "@/components/appointments/appointments-calendar";
import { AppointmentsDayPanel } from "@/components/appointments/appointments-day-panel";
import { DateNavigator } from "@/components/ui/date-navigator";

type Props = {
  salonId: string;
  initialAppointments: AppointmentWithCustomer[];
  initialBusinessHours: BusinessHours | null;
  initialSalonHolidays: string[] | null;
};

/** 予約管理のClient Component（初期データはServerから注入） */
export function AppointmentsView({ salonId, initialAppointments, initialBusinessHours, initialSalonHolidays }: Props) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "month">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const businessHours = initialBusinessHours;
  const salonHolidays = initialSalonHolidays;
  const [error, setError] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadAppointments = useCallback(async (date: Date, mode: "day" | "month") => {
    setLoading(true);
    const supabase = createClient();
    const [startDate, endDate] = mode === "day"
      ? [toDateStr(date), toDateStr(date)]
      : [toDateStr(new Date(date.getFullYear(), date.getMonth(), 1)), toDateStr(new Date(date.getFullYear(), date.getMonth() + 1, 0))];

    const { data } = await supabase
      .from("appointments")
      .select("*, customers(last_name, first_name)")
      .eq("salon_id", salonId)
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })
      .returns<AppointmentWithCustomer[]>();
    setAppointments(data ?? []);
    setLoading(false);
  }, [salonId]);

  useEffect(() => {
    if (isInitialLoad) { setIsInitialLoad(false); return; }
    loadAppointments(selectedDate, viewMode);
  }, [selectedDate, viewMode, loadAppointments, isInitialLoad]);

  const navigateDate = (offset: number) => {
    const d = new Date(selectedDate);
    if (viewMode === "day") d.setDate(d.getDate() + offset);
    else { d.setMonth(d.getMonth() + offset); setSelectedDay(null); }
    setSelectedDate(d);
  };

  const goToToday = () => { const now = new Date(); setSelectedDate(now); if (viewMode === "month") setSelectedDay(now.getDate()); };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setError("");
    const supabase = createClient();
    const { error: e } = await supabase.from("appointments").update({ status: newStatus }).eq("id", id).eq("salon_id", salonId);
    if (e) { setError("ステータスの更新に失敗しました"); return; }
    loadAppointments(selectedDate, viewMode);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この予約を削除しますか？")) return;
    setError("");
    const supabase = createClient();
    const { error: e } = await supabase.from("appointments").delete().eq("id", id).eq("salon_id", salonId);
    if (e) { setError("予約の削除に失敗しました"); return; }
    loadAppointments(selectedDate, viewMode);
  };

  const todayStr = toDateStr(new Date());
  const isSelectedToday = toDateStr(selectedDate) === todayStr;
  const dateLabel = viewMode === "day"
    ? `${selectedDate.getFullYear()}/${selectedDate.getMonth() + 1}/${selectedDate.getDate()}（${DAY_NAMES[selectedDate.getDay()]}）`
    : `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">予約管理</h2>
        <Link href="/appointments/new" className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[48px] flex items-center">+ 予約を登録</Link>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* ビューモード切替 */}
      <div className="flex gap-2">
        <button onClick={() => setViewMode("day")} className={`text-sm px-4 py-2 rounded-xl transition-colors min-h-[48px] ${viewMode === "day" ? "bg-accent text-white" : "bg-surface border border-border text-text-light hover:text-text"}`}>日別</button>
        <button onClick={() => { setViewMode("month"); setSelectedDay(null); }} className={`text-sm px-4 py-2 rounded-xl transition-colors min-h-[48px] ${viewMode === "month" ? "bg-accent text-white" : "bg-surface border border-border text-text-light hover:text-text"}`}>月別</button>
        <button onClick={goToToday} className={`text-sm px-4 py-2 rounded-xl transition-colors min-h-[48px] ml-auto ${isSelectedToday ? "bg-accent/10 text-accent border border-accent/30" : "bg-surface border border-border text-text-light hover:text-text"}`}>今日</button>
      </div>

      <DateNavigator label={dateLabel} onPrev={() => navigateDate(-1)} onNext={() => navigateDate(1)} />

      {/* 営業時間表示（日別ビュー） */}
      {viewMode === "day" && businessHours && (() => {
        const schedule = getScheduleForDate(businessHours, selectedDate, salonHolidays);
        if (!schedule.is_open) return <p className="text-xs text-text-light text-center">{isIrregularHoliday(salonHolidays, selectedDate) ? "臨時休業日" : "休業日"}</p>;
        return <p className="text-xs text-text-light text-center">営業時間: {schedule.open_time} 〜 {schedule.close_time}</p>;
      })()}

      {/* コンテンツ */}
      {loading ? (
        <div className="text-center text-text-light py-8">読み込み中...</div>
      ) : viewMode === "day" ? (
        appointments.length > 0 ? (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
            {businessHours && !isBusinessDay(businessHours, selectedDate, salonHolidays) ? (
              <div className="space-y-1">
                <p className="font-medium">{isIrregularHoliday(salonHolidays, selectedDate) ? "臨時休業日" : "休業日"}</p>
                <p className="text-xs">{isIrregularHoliday(salonHolidays, selectedDate) ? "この日は臨時休業日に設定されています" : "この曜日は休業日に設定されています"}</p>
              </div>
            ) : <p>この日の予約はありません</p>}
          </div>
        )
      ) : (
        <div className="space-y-3">
          <AppointmentsCalendar selectedDate={selectedDate} appointments={appointments} businessHours={businessHours} salonHolidays={salonHolidays} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          {selectedDay !== null && selectedDay <= new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate() && (
            <AppointmentsDayPanel selectedDate={selectedDate} selectedDay={selectedDay} appointments={appointments} businessHours={businessHours} salonHolidays={salonHolidays} onDrillThrough={(date: Date) => { setSelectedDate(date); setViewMode("day"); }} />
          )}
        </div>
      )}
    </div>
  );
}
