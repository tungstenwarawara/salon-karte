"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getStaffSchedulesForWeek,
  getWeekMonday,
  type StaffScheduleOverride,
} from "@/lib/staff-schedule";
import { toDateString, timeToMinutes } from "@/lib/business-hours";
import type { BusinessHours } from "@/types/database";
import { WeekTimeGrid } from "./week-time-grid";
import { WeekDayTabs } from "./week-day-tabs";
import type { ColumnDef } from "./week-grid-column";
import type { WeekAppointment } from "./week-appointment-block";

type Props = {
  salonId: string;
  selectedDate: Date;
  businessHours: BusinessHours | null;
  salonHolidays: string[] | null;
};

type StaffRow = { id: string; name: string; default_schedule: BusinessHours | null };
type OverrideRow = { staff_id: string; override_date: string; is_working: boolean; start_time: string | null; end_time: string | null };
type FetchedAppointment = WeekAppointment & { appointment_date: string; staff_id: string | null };

const DAY_NAMES_SHORT = ["日", "月", "火", "水", "木", "金", "土"];

/** 週間カレンダーのデータフェッチ + レイアウト判定 + グリッド組立 */
export function WeekViewContainer({ salonId, selectedDate, businessHours, salonHolidays }: Props) {
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [appointments, setAppointments] = useState<FetchedAppointment[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // 週の日付を生成
  const weekStart = getWeekMonday(selectedDate);
  const weekStartStr = toDateString(weekStart);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    dates.push(toDateString(d));
  }
  const todayStr = toDateString(new Date());

  // 週が変わったら選択日をリセット
  useEffect(() => {
    const todayIdx = dates.indexOf(todayStr);
    setSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0);
  }, [weekStartStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const startStr = dates[0];
    const endStr = dates[6];

    const [staffRes, overridesRes, appointmentsRes] = await Promise.all([
      supabase.from("staff").select("id, name, default_schedule").eq("salon_id", salonId).eq("is_active", true).order("name").returns<StaffRow[]>(),
      supabase.from("staff_schedule_overrides").select("staff_id, override_date, is_working, start_time, end_time").eq("salon_id", salonId).gte("override_date", startStr).lte("override_date", endStr).returns<OverrideRow[]>(),
      supabase.from("appointments").select("id, appointment_date, start_time, end_time, status, menu_name_snapshot, staff_id, customers(last_name, first_name), staff(name)")
        .eq("salon_id", salonId).gte("appointment_date", startStr).lte("appointment_date", endStr)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true })
        .returns<FetchedAppointment[]>(),
    ]);

    setStaffList(staffRes.data ?? []);
    setOverrides(overridesRes.data ?? []);
    setAppointments(appointmentsRes.data ?? []);
    setLoading(false);
  }, [salonId, weekStartStr]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div className="text-center text-text-light py-8">読み込み中...</div>;
  }

  if (staffList.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <p className="text-text-light text-sm">アクティブなスタッフがいません</p>
      </div>
    );
  }

  const isMultiStaff = staffList.length > 1;

  // スケジュール解決
  const overridesForCalc: StaffScheduleOverride[] = overrides.map((o) => ({
    staff_id: o.staff_id, override_date: o.override_date,
    is_working: o.is_working, start_time: o.start_time, end_time: o.end_time,
  }));
  const weeklySchedules = getStaffSchedulesForWeek(weekStart, staffList, businessHours, salonHolidays, overridesForCalc);

  // カラム生成
  let columns: ColumnDef[];
  if (!isMultiStaff) {
    // 1人サロン: 7日カラム
    const staff = staffList[0];
    const staffSchedule = weeklySchedules[0];
    columns = dates.map((dateStr) => {
      const d = new Date(dateStr + "T00:00:00");
      return {
        key: dateStr,
        label: `${DAY_NAMES_SHORT[d.getDay()]} ${d.getDate()}`,
        dateStr,
        staffId: staff.id,
        schedule: staffSchedule.days[dateStr] ?? { isWorking: false, startTime: "10:00", endTime: "20:00", source: "salon" as const },
        appointments: appointments.filter((a) => a.appointment_date === dateStr),
      };
    });
  } else {
    // 複数スタッフ: 選択日のスタッフカラム
    const selectedDateStr = dates[selectedDayIndex] ?? dates[0];
    columns = staffList.map((staff) => {
      const staffSchedule = weeklySchedules.find((ws) => ws.staffId === staff.id);
      return {
        key: staff.id,
        label: staff.name,
        dateStr: selectedDateStr,
        staffId: staff.id,
        schedule: staffSchedule?.days[selectedDateStr] ?? { isWorking: false, startTime: "10:00", endTime: "20:00", source: "salon" as const },
        appointments: appointments.filter((a) => a.appointment_date === selectedDateStr && a.staff_id === staff.id),
      };
    });
  }

  // 時間範囲の算出（全カラムの最早open〜最遅close）
  let minHour = 24;
  let maxHour = 0;
  for (const col of columns) {
    if (col.schedule.isWorking) {
      minHour = Math.min(minHour, Math.floor(timeToMinutes(col.schedule.startTime) / 60));
      maxHour = Math.max(maxHour, Math.ceil(timeToMinutes(col.schedule.endTime) / 60));
    }
  }
  if (minHour >= maxHour) { minHour = 9; maxHour = 21; }
  const startHour = Math.max(0, minHour - 1);
  const endHour = Math.min(24, maxHour + 1);

  // 曜日タブ用の予約件数
  const appointmentCounts = dates.map((dateStr) =>
    appointments.filter((a) => a.appointment_date === dateStr).length
  );

  return (
    <div className="space-y-3">
      {isMultiStaff && (
        <WeekDayTabs
          dates={dates}
          selectedIndex={selectedDayIndex}
          onSelect={setSelectedDayIndex}
          appointmentCounts={appointmentCounts}
          todayStr={todayStr}
        />
      )}
      <WeekTimeGrid
        columns={columns}
        startHour={startHour}
        endHour={endHour}
        todayStr={todayStr}
      />
    </div>
  );
}
