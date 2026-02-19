"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Database, BusinessHours } from "@/types/database";
import { getScheduleForDate, isBusinessDay } from "@/lib/business-hours";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type AppointmentWithCustomer = Appointment & {
  customers: { last_name: string; first_name: string } | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "予定", color: "bg-blue-100 text-blue-700" },
  completed: { label: "来店済", color: "bg-green-100 text-green-700" },
  cancelled: { label: "キャンセル", color: "bg-gray-100 text-gray-500" },
};

const SOURCE_LABELS: Record<string, string> = {
  direct: "直接",
  hotpepper: "HP",
  phone: "電話",
  line: "LINE",
  other: "他",
};

function formatTime(time: string) {
  return time.slice(0, 5);
}

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_NAMES = ["月", "火", "水", "木", "金", "土", "日"];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);

  const loadAppointments = useCallback(async (date: Date, mode: "day" | "week" | "month") => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: salon } = await supabase
      .from("salons")
      .select("id, business_hours")
      .eq("owner_id", user.id)
      .single<{ id: string; business_hours: BusinessHours | null }>();
    if (!salon) return;
    setBusinessHours(salon.business_hours);

    let startDate: string;
    let endDate: string;

    if (mode === "day") {
      startDate = toDateStr(date);
      endDate = startDate;
    } else if (mode === "week") {
      const week = getWeekDates(date);
      startDate = toDateStr(week[0]);
      endDate = toDateStr(week[6]);
    } else {
      // month mode
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
    } else if (viewMode === "week") {
      d.setDate(d.getDate() + offset * 7);
    } else {
      d.setMonth(d.getMonth() + offset);
    }
    setSelectedDate(d);
  };

  const goToToday = () => setSelectedDate(new Date());

  const [error, setError] = useState("");

  const handleStatusChange = async (id: string, newStatus: string) => {
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);
    if (updateError) {
      setError("ステータスの更新に失敗しました");
      return;
    }
    loadAppointments(selectedDate, viewMode);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この予約を削除しますか？")) return;
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError("予約の削除に失敗しました");
      return;
    }
    loadAppointments(selectedDate, viewMode);
  };

  const weekDates = getWeekDates(selectedDate);
  const todayStr = toDateStr(new Date());

  const dateLabel =
    viewMode === "day"
      ? `${selectedDate.getFullYear()}/${selectedDate.getMonth() + 1}/${selectedDate.getDate()}（${DAY_NAMES[(selectedDate.getDay() + 6) % 7]}）`
      : viewMode === "week"
        ? `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} 〜 ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`
        : `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月`;

  const renderAppointmentCard = (apt: AppointmentWithCustomer) => {
    const statusInfo = STATUS_LABELS[apt.status] ?? STATUS_LABELS.scheduled;
    const customer = apt.customers;
    return (
      <div
        key={apt.id}
        className="bg-surface border border-border rounded-xl p-3 space-y-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              {formatTime(apt.start_time)}
              {apt.end_time ? ` - ${formatTime(apt.end_time)}` : ""}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
            {apt.source && apt.source !== "direct" && (
              <span className="text-xs text-text-light">
                {SOURCE_LABELS[apt.source] ?? apt.source}
              </span>
            )}
          </div>
          {apt.status === "scheduled" && (
            <Link
              href={`/appointments/${apt.id}/edit`}
              className="text-xs text-text-light hover:text-accent transition-colors"
            >
              編集
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/customers/${apt.customer_id}`}
            className="font-medium text-sm hover:text-accent transition-colors"
          >
            {customer
              ? `${customer.last_name} ${customer.first_name}`
              : "不明"}
          </Link>
          {apt.menu_name_snapshot && (
            <span className="text-xs text-text-light">
              {apt.menu_name_snapshot}
            </span>
          )}
        </div>

        {apt.memo && (
          <p className="text-xs text-text-light">{apt.memo}</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {apt.status === "scheduled" && (
            <>
              <button
                onClick={() => handleStatusChange(apt.id, "completed")}
                className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors min-h-[32px]"
              >
                来店済みにする
              </button>
              <button
                onClick={() => handleStatusChange(apt.id, "cancelled")}
                className="text-xs bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors min-h-[32px]"
              >
                キャンセル
              </button>
            </>
          )}
          {apt.status === "completed" && !apt.treatment_record_id && (
            <Link
              href={`/records/new?customer=${apt.customer_id}&appointment=${apt.id}`}
              className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors min-h-[32px] flex items-center"
            >
              カルテを作成
            </Link>
          )}
          {apt.status === "completed" && apt.treatment_record_id && (
            <Link
              href={`/records/${apt.treatment_record_id}`}
              className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors min-h-[32px] flex items-center"
            >
              カルテを見る
            </Link>
          )}
          {!apt.treatment_record_id && (
            <button
              onClick={() => handleDelete(apt.id)}
              className="text-xs text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors min-h-[32px] ml-auto"
            >
              削除
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">予約管理</h2>
        <Link
          href="/appointments/new"
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[40px] flex items-center"
        >
          + 予約登録
        </Link>
      </div>

      {error && (
        <div className="bg-error/10 text-error text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* View mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("day")}
          className={`text-sm px-4 py-2 rounded-xl transition-colors min-h-[40px] ${
            viewMode === "day"
              ? "bg-accent text-white"
              : "bg-surface border border-border text-text-light hover:text-text"
          }`}
        >
          日別
        </button>
        <button
          onClick={() => setViewMode("week")}
          className={`text-sm px-4 py-2 rounded-xl transition-colors min-h-[40px] ${
            viewMode === "week"
              ? "bg-accent text-white"
              : "bg-surface border border-border text-text-light hover:text-text"
          }`}
        >
          週別
        </button>
        <button
          onClick={() => setViewMode("month")}
          className={`text-sm px-4 py-2 rounded-xl transition-colors min-h-[40px] ${
            viewMode === "month"
              ? "bg-accent text-white"
              : "bg-surface border border-border text-text-light hover:text-text"
          }`}
        >
          月別
        </button>
        <button
          onClick={goToToday}
          className="text-sm px-4 py-2 rounded-xl bg-surface border border-border text-text-light hover:text-text transition-colors min-h-[40px] ml-auto"
        >
          今日
        </button>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
        <button
          onClick={() => navigateDate(-1)}
          className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="font-medium text-sm">{dateLabel}</span>
        <button
          onClick={() => navigateDate(1)}
          className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Business hours context for day view */}
      {viewMode === "day" && businessHours && (() => {
        const schedule = getScheduleForDate(businessHours, selectedDate);
        if (!schedule.is_open) return (
          <p className="text-xs text-text-light text-center">休業日</p>
        );
        return (
          <p className="text-xs text-text-light text-center">
            営業時間: {schedule.open_time} 〜 {schedule.close_time}
          </p>
        );
      })()}

      {/* Content */}
      {loading ? (
        <div className="text-center text-text-light py-8">読み込み中...</div>
      ) : viewMode === "day" ? (
        /* Day view */
        appointments.length > 0 ? (
          <div className="space-y-2">
            {appointments.map(renderAppointmentCard)}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
            {businessHours && !isBusinessDay(businessHours, selectedDate) ? (
              <div className="space-y-1">
                <p className="font-medium">休業日</p>
                <p className="text-xs">この曜日は休業日に設定されています</p>
              </div>
            ) : (
              <p>この日の予約はありません</p>
            )}
          </div>
        )
      ) : viewMode === "week" ? (
        /* Week view */
        <div className="space-y-4">
          {weekDates.map((date, i) => {
            const dateStr = toDateStr(date);
            const dayAppointments = appointments.filter(
              (a) => a.appointment_date === dateStr
            );
            const isToday = dateStr === todayStr;

            return (
              <div key={dateStr}>
                <div
                  className={`text-sm font-medium mb-2 px-1 ${
                    isToday ? "text-accent" : "text-text-light"
                  }`}
                >
                  {date.getMonth() + 1}/{date.getDate()}（{DAY_NAMES[i]}）
                  {isToday && (
                    <span className="ml-2 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                      今日
                    </span>
                  )}
                  {businessHours && !isBusinessDay(businessHours, date) && (
                    <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                      休
                    </span>
                  )}
                  <span className="ml-2 text-xs">
                    {dayAppointments.filter((a) => a.status !== "cancelled").length}件
                  </span>
                </div>
                {dayAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {dayAppointments.map(renderAppointmentCard)}
                  </div>
                ) : (
                  <div className="bg-surface border border-border rounded-xl p-3 text-center text-text-light text-sm">
                    {businessHours && !isBusinessDay(businessHours, date) ? "休業日" : "予約なし"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Month calendar view */
        (() => {
          const year = selectedDate.getFullYear();
          const month = selectedDate.getMonth();
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);
          const daysInMonth = lastDay.getDate();
          // Sunday=0 start for Japanese calendar
          const startDow = firstDay.getDay();

          // Group appointments by date
          const appointmentsByDate: Record<string, AppointmentWithCustomer[]> = {};
          for (const apt of appointments) {
            if (!appointmentsByDate[apt.appointment_date]) {
              appointmentsByDate[apt.appointment_date] = [];
            }
            appointmentsByDate[apt.appointment_date].push(apt);
          }

          const calendarDayHeaders = ["日", "月", "火", "水", "木", "金", "土"];
          const cells: (number | null)[] = [];
          for (let i = 0; i < startDow; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);
          // Fill remaining cells to complete the grid row
          while (cells.length % 7 !== 0) cells.push(null);

          return (
            <div className="bg-surface border border-border rounded-2xl p-4">
              {/* Calendar header */}
              <div className="grid grid-cols-7 mb-2">
                {calendarDayHeaders.map((name, i) => (
                  <div
                    key={name}
                    className={`text-center text-xs font-medium py-1 ${
                      i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-text-light"
                    }`}
                  >
                    {name}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px">
                {cells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  const cellDate = new Date(year, month, day);
                  const dateStr = toDateStr(cellDate);
                  const isToday = dateStr === todayStr;
                  const dayApts = appointmentsByDate[dateStr] ?? [];
                  const activeCount = dayApts.filter((a) => a.status !== "cancelled").length;
                  const dow = cellDate.getDay();
                  const isHoliday = businessHours && !isBusinessDay(businessHours, cellDate);

                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDate(cellDate);
                        setViewMode("day");
                      }}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-colors relative ${
                        isToday
                          ? "bg-accent text-white font-bold"
                          : isHoliday
                            ? "text-gray-300"
                            : dow === 0
                              ? "text-red-400"
                              : dow === 6
                                ? "text-blue-400"
                                : "text-text"
                      } hover:bg-accent/10`}
                    >
                      <span className={`${isToday ? "text-white" : ""} text-sm`}>{day}</span>
                      {activeCount > 0 && (
                        <div className="flex items-center justify-center mt-0.5">
                          {activeCount <= 3 ? (
                            <div className="flex gap-0.5">
                              {Array.from({ length: activeCount }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 h-1 rounded-full ${
                                    isToday ? "bg-white" : "bg-accent"
                                  }`}
                                />
                              ))}
                            </div>
                          ) : (
                            <span
                              className={`text-[10px] font-bold ${
                                isToday ? "text-white" : "text-accent"
                              }`}
                            >
                              {activeCount}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="text-[10px] text-text-light">予約あり</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-accent flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">N</span>
                  </div>
                  <span className="text-[10px] text-text-light">4件以上</span>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
