"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import type { BusinessHours, HourOverrides } from "@/types/database";
import { DAY_KEY_MAP, DAY_SHORT_LABELS, DEFAULT_BUSINESS_HOURS } from "@/lib/business-hours";
import { buildCalendar } from "@/lib/calendar-utils";
import { HolidayCalendarGrid } from "@/components/settings/holiday-calendar-grid";
import { DateScheduleEditor } from "@/components/settings/date-schedule-editor";

export default function HolidaysPage() {
  const [salonId, setSalonId] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [originalHolidays, setOriginalHolidays] = useState<Set<string>>(new Set());
  const [hourOverrides, setHourOverrides] = useState<HourOverrides>({});
  const [originalHourOverrides, setOriginalHourOverrides] = useState<HourOverrides>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    const load = async () => {
      const { user, salonId: sid } = await getClientAuth();
      if (!user || !sid) return;
      setSalonId(sid);

      const supabase = createClient();
      const { data: salon } = await supabase
        .from("salons")
        .select("id, business_hours, salon_holidays, hour_overrides")
        .eq("id", sid)
        .single<{ id: string; business_hours: BusinessHours | null; salon_holidays: string[] | null; hour_overrides: HourOverrides | null }>();

      if (salon) {
        if (salon.business_hours) setBusinessHours(salon.business_hours);
        const h = new Set(salon.salon_holidays ?? []);
        setHolidays(h);
        setOriginalHolidays(new Set(h));
        const ho = salon.hour_overrides ?? {};
        setHourOverrides(ho);
        setOriginalHourOverrides({ ...ho });
      }
      setLoaded(true);
    };
    load();
  }, []);

  const handleDateSelect = useCallback((dateStr: string) => {
    setSelectedDate((prev) => prev === dateStr ? null : dateStr);
  }, []);

  const handleSetNormal = useCallback(() => {
    if (!selectedDate) return;
    setHolidays((prev) => { const next = new Set(prev); next.delete(selectedDate); return next; });
    setHourOverrides((prev) => { const { [selectedDate]: _, ...rest } = prev; return rest; });
  }, [selectedDate]);

  const handleSetHoliday = useCallback(() => {
    if (!selectedDate) return;
    setHolidays((prev) => new Set(prev).add(selectedDate));
    setHourOverrides((prev) => { const { [selectedDate]: _, ...rest } = prev; return rest; });
  }, [selectedDate]);

  const handleSetHourOverride = useCallback((openTime: string, closeTime: string) => {
    if (!selectedDate) return;
    setHolidays((prev) => { const next = new Set(prev); next.delete(selectedDate); return next; });
    setHourOverrides((prev) => ({
      ...prev,
      [selectedDate]: { is_open: true, open_time: openTime, close_time: closeTime },
    }));
  }, [selectedDate]);

  const hasChanges = (() => {
    if (holidays.size !== originalHolidays.size) return true;
    for (const d of holidays) { if (!originalHolidays.has(d)) return true; }
    if (JSON.stringify(hourOverrides) !== JSON.stringify(originalHourOverrides)) return true;
    return false;
  })();

  const handleSave = async () => {
    setSaving(true); setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("salons")
      .update({ salon_holidays: Array.from(holidays).sort(), hour_overrides: hourOverrides })
      .eq("id", salonId);
    if (updateError) { console.error("保存エラー:", updateError); setError(`保存に失敗しました: ${updateError.message}`); setSaving(false); return; }
    setOriginalHolidays(new Set(holidays));
    setOriginalHourOverrides({ ...hourOverrides });
    showToast("設定を保存しました");
    setSaving(false);
  };

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(viewYear - 1); setViewMonth(12); } else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(viewYear + 1); setViewMonth(1); } else setViewMonth(viewMonth + 1);
  };

  const calendarDays = buildCalendar(viewYear, viewMonth, businessHours, holidays, hourOverrides);
  const monthHolidayCount = calendarDays.filter((d) => d.isCurrentMonth && d.isIrregularHoliday).length;
  const monthOverrideCount = calendarDays.filter((d) => d.isCurrentMonth && d.hasHourOverride && !d.isIrregularHoliday).length;

  const selectedDaySchedule = selectedDate
    ? businessHours[DAY_KEY_MAP[new Date(selectedDate + "T00:00:00").getDay()]]
    : null;

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="不定休・営業時間変更"
        breadcrumbs={[{ label: "設定", href: "/settings" }, { label: "不定休・営業時間変更" }]} />

      <p className="text-sm text-text-light">
        カレンダーの日付をタップして、臨時休業や営業時間の変更を設定できます。
        曜日ごとの定休日は<a href="/settings/business-hours" className="text-accent hover:underline">営業時間設定</a>で変更できます。
      </p>

      {error && <ErrorAlert message={error} />}

      <HolidayCalendarGrid
        viewYear={viewYear} viewMonth={viewMonth} calendarDays={calendarDays}
        hourOverrides={hourOverrides} selectedDateStr={selectedDate}
        onPrevMonth={prevMonth} onNextMonth={nextMonth} onDateSelect={handleDateSelect} />

      {/* 選択日の編集パネル */}
      {selectedDate && selectedDaySchedule && (
        <DateScheduleEditor
          dateStr={selectedDate} businessHours={businessHours}
          isHoliday={holidays.has(selectedDate)}
          hourOverride={hourOverrides[selectedDate] ?? null}
          defaultSchedule={selectedDaySchedule}
          onSetNormal={handleSetNormal} onSetHoliday={handleSetHoliday}
          onSetHourOverride={handleSetHourOverride}
          onClose={() => setSelectedDate(null)} />
      )}

      {/* サマリー */}
      {(monthHolidayCount > 0 || monthOverrideCount > 0) && (
        <div className="space-y-2">
          {monthHolidayCount > 0 && (
            <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 text-sm">
              <span className="font-medium text-error">{viewMonth}月の臨時休業: {monthHolidayCount}日</span>
              <div className="mt-1 text-text-light">
                {calendarDays
                  .filter((d) => d.isCurrentMonth && d.isIrregularHoliday)
                  .map((d) => `${d.day}日(${DAY_SHORT_LABELS[DAY_KEY_MAP[d.date.getDay()]]})`)
                  .join("、")}
              </div>
            </div>
          )}
          {monthOverrideCount > 0 && (
            <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 text-sm">
              <span className="font-medium text-accent">{viewMonth}月の時間変更: {monthOverrideCount}日</span>
              <div className="mt-1 text-text-light">
                {calendarDays
                  .filter((d) => d.isCurrentMonth && d.hasHourOverride && !d.isIrregularHoliday)
                  .map((d) => {
                    const ov = hourOverrides[d.dateStr];
                    return `${d.day}日 ${ov?.open_time}〜${ov?.close_time}`;
                  })
                  .join("、")}
              </div>
            </div>
          )}
        </div>
      )}

      <SubmitButton type="button" onClick={handleSave} loading={saving} disabled={!hasChanges}
        label={hasChanges ? "保存する" : "変更なし"} className="w-full" />
    </div>
  );
}
