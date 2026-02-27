"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ShiftWeeklyGrid } from "@/components/settings/shift-weekly-grid";
import { ShiftDayEditor } from "@/components/settings/shift-day-editor";
import type { BusinessHours } from "@/types/database";
import {
  getStaffSchedulesForWeek,
  getWeekMonday,
  type ResolvedSchedule,
  type WeeklyStaffSchedule,
  type StaffScheduleOverride,
} from "@/lib/staff-schedule";
import { toDateString } from "@/lib/business-hours";

type StaffRow = { id: string; name: string; default_schedule: BusinessHours | null };
type OverrideRow = { id: string; staff_id: string; override_date: string; is_working: boolean; start_time: string | null; end_time: string | null };
type SelectedCell = { staffId: string; staffName: string; dateStr: string; schedule: ResolvedSchedule };

export default function ShiftsPage() {
  const [salonId, setSalonId] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [salonHolidays, setSalonHolidays] = useState<string[] | null>(null);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(getWeekMonday(new Date()));
  const [schedules, setSchedules] = useState<WeeklyStaffSchedule[]>([]);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  const loadData = useCallback(async (sid: string, ws: Date) => {
    const supabase = createClient();
    const weekEndDate = new Date(ws);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const startStr = toDateString(ws);
    const endStr = toDateString(weekEndDate);

    const [salonRes, staffRes, overridesRes] = await Promise.all([
      supabase.from("salons").select("business_hours, salon_holidays").eq("id", sid).single<{ business_hours: BusinessHours | null; salon_holidays: string[] | null }>(),
      supabase.from("staff").select("id, name, default_schedule").eq("salon_id", sid).eq("is_active", true).order("name").returns<StaffRow[]>(),
      supabase.from("staff_schedule_overrides").select("id, staff_id, override_date, is_working, start_time, end_time").eq("salon_id", sid).gte("override_date", startStr).lte("override_date", endStr).returns<OverrideRow[]>(),
    ]);

    const bh = salonRes.data?.business_hours ?? null;
    const sh = salonRes.data?.salon_holidays ?? null;
    const sl = staffRes.data ?? [];
    const ov = overridesRes.data ?? [];

    setBusinessHours(bh);
    setSalonHolidays(sh);
    setStaffList(sl);
    setOverrides(ov);

    const overridesForCalc: StaffScheduleOverride[] = ov.map((o) => ({
      staff_id: o.staff_id, override_date: o.override_date,
      is_working: o.is_working, start_time: o.start_time, end_time: o.end_time,
    }));
    setSchedules(getStaffSchedulesForWeek(ws, sl, bh, sh, overridesForCalc));
  }, []);

  useEffect(() => {
    const init = async () => {
      const { user, salonId: sid } = await getClientAuth();
      if (!user || !sid) return;
      setSalonId(sid);
      await loadData(sid, weekStart);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeWeek = async (offset: number) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + offset * 7);
    setWeekStart(newStart);
    setSelectedCell(null);
    if (salonId) await loadData(salonId, newStart);
  };

  const goToday = async () => {
    const newStart = getWeekMonday(new Date());
    setWeekStart(newStart);
    setSelectedCell(null);
    if (salonId) await loadData(salonId, newStart);
  };

  const handleCellTap = (staffId: string, staffName: string, dateStr: string, schedule: ResolvedSchedule) => {
    if (selectedCell?.staffId === staffId && selectedCell?.dateStr === dateStr) {
      setSelectedCell(null);
    } else {
      setSelectedCell({ staffId, staffName, dateStr, schedule });
    }
  };

  const handleSaveOverride = async (isWorking: boolean, startTime: string, endTime: string) => {
    if (!salonId || !selectedCell) return;
    setError("");
    setSaving(true);

    const supabase = createClient();
    const { error: upsertError } = await supabase.from("staff_schedule_overrides").upsert(
      { staff_id: selectedCell.staffId, salon_id: salonId, override_date: selectedCell.dateStr, is_working: isWorking, start_time: isWorking ? startTime : null, end_time: isWorking ? endTime : null },
      { onConflict: "staff_id,override_date" }
    );

    if (upsertError) {
      setError(`保存に失敗しました: ${upsertError.message}`);
    } else {
      showToast("シフトを保存しました");
      setSelectedCell(null);
      await loadData(salonId, weekStart);
    }
    setSaving(false);
  };

  const handleRemoveOverride = async () => {
    if (!salonId || !selectedCell) return;
    setError("");
    setSaving(true);

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("staff_schedule_overrides").delete().eq("staff_id", selectedCell.staffId).eq("override_date", selectedCell.dateStr).eq("salon_id", salonId);

    if (deleteError) {
      setError(`解除に失敗しました: ${deleteError.message}`);
    } else {
      showToast("特別変更を解除しました");
      setSelectedCell(null);
      await loadData(salonId, weekStart);
    }
    setSaving(false);
  };

  // 週ヘッダーの表示
  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()} 〜 ${weekEndDate.getMonth() + 1}/${weekEndDate.getDate()}`;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title="シフト管理"
        breadcrumbs={[{ label: "設定", href: "/settings" }, { label: "シフト管理" }]}
      />

      {error && <ErrorAlert message={error} />}

      {/* 週ナビゲーション */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeWeek(-1)} className="text-sm text-accent hover:underline min-h-[44px] px-2">← 前週</button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{weekLabel}</span>
          <button onClick={goToday} className="text-xs text-accent border border-accent rounded-lg px-2 py-1 hover:bg-accent/5 min-h-[32px]">今週</button>
        </div>
        <button onClick={() => changeWeek(1)} className="text-sm text-accent hover:underline min-h-[44px] px-2">次週 →</button>
      </div>

      {/* 週間グリッド */}
      <ShiftWeeklyGrid
        weekStartDate={weekStart}
        schedules={schedules}
        onCellTap={handleCellTap}
        selectedCell={selectedCell ? { staffId: selectedCell.staffId, dateStr: selectedCell.dateStr } : null}
      />

      {/* 日編集パネル */}
      {selectedCell && (
        <ShiftDayEditor
          staffName={selectedCell.staffName}
          dateStr={selectedCell.dateStr}
          schedule={selectedCell.schedule}
          saving={saving}
          onSave={handleSaveOverride}
          onRemoveOverride={handleRemoveOverride}
          onClose={() => setSelectedCell(null)}
        />
      )}

      {/* 説明 */}
      <div className="text-xs text-text-light space-y-1 px-1">
        <p>スタッフ名をタップ → デフォルトスケジュールを編集</p>
        <p>セルをタップ → その日だけの特別変更を設定</p>
      </div>
    </div>
  );
}
