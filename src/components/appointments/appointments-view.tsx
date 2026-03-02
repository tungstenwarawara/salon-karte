"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { BusinessHours, HourOverrides } from "@/types/database";
import { getScheduleForDate, isBusinessDay, isIrregularHoliday, hasHourOverride } from "@/lib/business-hours";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import type { AppointmentWithCustomer } from "@/components/appointments/appointment-card";
import { AppointmentsCalendar, toDateStr, DAY_NAMES } from "@/components/appointments/appointments-calendar";
import { AppointmentsDayPanel } from "@/components/appointments/appointments-day-panel";
import { WeekViewContainer } from "@/components/appointments/week-view-container";
import { DateNavigator } from "@/components/ui/date-navigator";
import { getWeekMonday } from "@/lib/staff-schedule";

type Props = {
  salonId: string;
  initialAppointments: AppointmentWithCustomer[];
  initialBusinessHours: BusinessHours | null;
  initialSalonHolidays: string[] | null;
  initialHourOverrides: HourOverrides | null;
};

/** 予約管理のClient Component（初期データはServerから注入） */
export function AppointmentsView({ salonId, initialAppointments, initialBusinessHours, initialSalonHolidays, initialHourOverrides }: Props) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const businessHours = initialBusinessHours;
  const salonHolidays = initialSalonHolidays;
  const hourOverrides = initialHourOverrides;
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadAppointments = useCallback(async (date: Date, mode: "day" | "week" | "month") => {
    if (mode === "week") return; // WeekViewContainer側でフェッチ
    setLoading(true);
    const supabase = createClient();
    const [startDate, endDate] = mode === "day"
      ? [toDateStr(date), toDateStr(date)]
      : [toDateStr(new Date(date.getFullYear(), date.getMonth(), 1)), toDateStr(new Date(date.getFullYear(), date.getMonth() + 1, 0))];

    const { data } = await supabase
      .from("appointments")
      .select("id, appointment_date, start_time, end_time, status, menu_name_snapshot, treatment_record_id, customers(last_name, first_name), staff(name)")
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
    else if (viewMode === "week") d.setDate(d.getDate() + offset * 7);
    else { d.setMonth(d.getMonth() + offset); setSelectedDay(null); }
    setSelectedDate(d);
  };

  const goToToday = () => { const now = new Date(); setSelectedDate(now); if (viewMode === "month") setSelectedDay(now.getDate()); };

  const todayStr = toDateStr(new Date());
  const isSelectedToday = toDateStr(selectedDate) === todayStr;
  const dateLabel = viewMode === "day"
    ? `${selectedDate.getFullYear()}/${selectedDate.getMonth() + 1}/${selectedDate.getDate()}（${DAY_NAMES[selectedDate.getDay()]}）`
    : viewMode === "week"
      ? (() => { const ws = getWeekMonday(selectedDate); const we = new Date(ws); we.setDate(we.getDate() + 6); return `${ws.getMonth() + 1}/${ws.getDate()} 〜 ${we.getMonth() + 1}/${we.getDate()}`; })()
      : `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">予約管理</h2>
        <Link href={`/appointments/new${viewMode === "day" ? `?date=${toDateStr(selectedDate)}` : selectedDay !== null ? `?date=${toDateStr(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDay))}` : ""}`} className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[48px] flex items-center">+ 予約を登録</Link>
      </div>

      {/* ビューモード切替 */}
      <div className="flex gap-2">
        <button onClick={() => setViewMode("day")} className={`text-sm px-3 py-2 rounded-xl transition-colors min-h-[48px] ${viewMode === "day" ? "bg-accent text-white" : "bg-surface border border-border text-text-light hover:text-text"}`}>日別</button>
        <button onClick={() => setViewMode("week")} className={`text-sm px-3 py-2 rounded-xl transition-colors min-h-[48px] ${viewMode === "week" ? "bg-accent text-white" : "bg-surface border border-border text-text-light hover:text-text"}`}>週別</button>
        <button onClick={() => { setViewMode("month"); setSelectedDay(null); }} className={`text-sm px-3 py-2 rounded-xl transition-colors min-h-[48px] ${viewMode === "month" ? "bg-accent text-white" : "bg-surface border border-border text-text-light hover:text-text"}`}>月別</button>
        <button onClick={goToToday} className={`text-sm px-3 py-2 rounded-xl transition-colors min-h-[48px] ml-auto ${isSelectedToday ? "bg-accent/10 text-accent border border-accent/30" : "bg-surface border border-border text-text-light hover:text-text"}`}>今日</button>
      </div>

      <DateNavigator label={dateLabel} onPrev={() => navigateDate(-1)} onNext={() => navigateDate(1)} />

      {/* 営業時間表示（日別ビュー） */}
      {viewMode === "day" && businessHours && (() => {
        const schedule = getScheduleForDate(businessHours, selectedDate, salonHolidays, hourOverrides);
        if (!schedule.is_open) return <p className="text-xs text-text-light text-center">{isIrregularHoliday(salonHolidays, selectedDate) ? "臨時休業日" : "休業日"}</p>;
        const isOverridden = hasHourOverride(hourOverrides, selectedDate);
        return <p className="text-xs text-text-light text-center">営業時間: {schedule.open_time} 〜 {schedule.close_time}{isOverridden ? "（臨時変更）" : ""}</p>;
      })()}

      {/* コンテンツ */}
      {viewMode === "week" ? (
        <WeekViewContainer salonId={salonId} selectedDate={selectedDate} businessHours={businessHours} salonHolidays={salonHolidays} hourOverrides={hourOverrides} />
      ) : loading ? (
        <div className="text-center text-text-light py-8">読み込み中...</div>
      ) : viewMode === "day" ? (
        appointments.length > 0 ? (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
            {businessHours && !isBusinessDay(businessHours, selectedDate, salonHolidays, hourOverrides) ? (
              <div className="space-y-1">
                <p className="font-medium">{isIrregularHoliday(salonHolidays, selectedDate) ? "臨時休業日" : "休業日"}</p>
                <p className="text-xs">{isIrregularHoliday(salonHolidays, selectedDate) ? "この日は臨時休業日に設定されています" : "この曜日は休業日に設定されています"}</p>
              </div>
            ) : <p>この日の予約はありません</p>}
          </div>
        )
      ) : (
        <div className="space-y-3">
          <AppointmentsCalendar selectedDate={selectedDate} appointments={appointments} businessHours={businessHours} salonHolidays={salonHolidays} hourOverrides={hourOverrides} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          {selectedDay !== null && selectedDay <= new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate() && (
            <AppointmentsDayPanel selectedDate={selectedDate} selectedDay={selectedDay} appointments={appointments} businessHours={businessHours} salonHolidays={salonHolidays} hourOverrides={hourOverrides} />
          )}
        </div>
      )}
    </div>
  );
}
