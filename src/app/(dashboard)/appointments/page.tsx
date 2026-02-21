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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>([]);
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"day" | "month">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [salonHolidays, setSalonHolidays] = useState<string[] | null>(null);
  const [error, setError] = useState("");

  const loadAppointments = useCallback(async (date: Date, mode: "day" | "month") => {
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

    let startDate: string;
    let endDate: string;
    if (mode === "day") {
      startDate = toDateStr(date);
      endDate = startDate;
    } else {
      const first = new Date(date.getFullYear(), date.getMonth(), 1);
      const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      startDate = toDateStr(first);
      endDate = toDateStr(last);
    }

    const { data } = await supabase
      .from("appointments")
      .select("*, customers(last_name, first_name)")
      .eq("salon_id", salon.id)
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })
      .returns<AppointmentWithCustomer[]>();

    setAppointments(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAppointments(selectedDate, viewMode);
  }, [selectedDate, viewMode, loadAppointments]);

  const navigateDate = (offset: number) => {
    const d = new Date(selectedDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() + offset);
    } else {
      d.setMonth(d.getMonth() + offset);
      setSelectedDay(null);
    }
    setSelectedDate(d);
  };

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    if (viewMode === "month") setSelectedDay(now.getDate());
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("salon_id", salonId);
    if (updateError) { setError("ステータスの更新に失敗しました"); return; }
    loadAppointments(selectedDate, viewMode);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この予約を削除しますか？")) return;
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("salon_id", salonId);
    if (deleteError) { setError("予約の削除に失敗しました"); return; }
    loadAppointments(selectedDate, viewMode);
  };

  const handleDrillThrough = (date: Date) => {
    setSelectedDate(date);
    setViewMode("day");
  };

  const todayStr = toDateStr(new Date());
  const isSelectedToday = toDateStr(selectedDate) === todayStr;
  const dateLabel = viewMode === "day"
    ? `${selectedDate.getFullYear()}/${selectedDate.getMonth() + 1}/${selectedDate.getDate()}（${DAY_NAMES[selectedDate.getDay()]}）`
    : `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月`;

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">予約管理</h2>
        <Link href="/appointments/new"
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[48px] flex items-center">
          + 予約登録
        </Link>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* ビューモード切替 */}
      <div className="flex gap-2">
        <button onClick={() => setViewMode("day")}
          className={`text-sm px-4 py-2 rounded-xl transition-colors min-h-[48px] ${viewMode === "day" ? "bg-accent text-white" : "bg-surface border border-border text-text-light hover:text-text"}`}>
          日別
        </button>
        <button onClick={() => { setViewMode("month"); setSelectedDay(null); }}
          className={`text-sm px-4 py-2 rounded-xl transition-colors min-h-[48px] ${viewMode === "month" ? "bg-accent text-white" : "bg-surface border border-border text-text-light hover:text-text"}`}>
          月別
        </button>
        <button onClick={goToToday}
          className={`text-sm px-4 py-2 rounded-xl transition-colors min-h-[48px] ml-auto ${isSelectedToday ? "bg-accent/10 text-accent border border-accent/30" : "bg-surface border border-border text-text-light hover:text-text"}`}>
          今日
        </button>
      </div>

      {/* 日付ナビゲーション */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
        <button onClick={() => navigateDate(-1)} className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="font-medium text-sm">{dateLabel}</span>
        <button onClick={() => navigateDate(1)} className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* 営業時間表示（日別ビュー） */}
      {viewMode === "day" && businessHours && (() => {
        const schedule = getScheduleForDate(businessHours, selectedDate, salonHolidays);
        if (!schedule.is_open) return (
          <p className="text-xs text-text-light text-center">
            {isIrregularHoliday(salonHolidays, selectedDate) ? "臨時休業日" : "休業日"}
          </p>
        );
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
            ) : (
              <p>この日の予約はありません</p>
            )}
          </div>
        )
      ) : (
        <div className="space-y-3">
          <AppointmentsCalendar
            selectedDate={selectedDate} appointments={appointments} businessHours={businessHours}
            salonHolidays={salonHolidays} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          {selectedDay !== null && selectedDay <= new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate() && (
            <AppointmentsDayPanel
              selectedDate={selectedDate} selectedDay={selectedDay} appointments={appointments}
              businessHours={businessHours} salonHolidays={salonHolidays} onDrillThrough={handleDrillThrough} />
          )}
        </div>
      )}
    </div>
  );
}
