"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { BusinessHours } from "@/types/database";
import { DAY_KEY_MAP, DAY_SHORT_LABELS, DEFAULT_BUSINESS_HOURS } from "@/lib/business-hours";
import { buildCalendar } from "@/lib/calendar-utils";
import { HolidayCalendarGrid } from "@/components/settings/holiday-calendar-grid";

export default function HolidaysPage() {
  const [salonId, setSalonId] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [originalHolidays, setOriginalHolidays] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: salon } = await supabase
        .from("salons")
        .select("id, business_hours, salon_holidays")
        .eq("owner_id", user.id)
        .single<{ id: string; business_hours: BusinessHours | null; salon_holidays: string[] | null }>();

      if (salon) {
        setSalonId(salon.id);
        if (salon.business_hours) setBusinessHours(salon.business_hours);
        const h = new Set(salon.salon_holidays ?? []);
        setHolidays(h);
        setOriginalHolidays(new Set(h));
      }
      setLoaded(true);
    };
    load();
  }, []);

  const toggleHoliday = useCallback((dateStr: string) => {
    setHolidays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }, []);

  const hasChanges = (() => {
    if (holidays.size !== originalHolidays.size) return true;
    for (const d of holidays) { if (!originalHolidays.has(d)) return true; }
    return false;
  })();

  const handleSave = async () => {
    setSaving(true); setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("salons")
      .update({ salon_holidays: Array.from(holidays).sort() })
      .eq("id", salonId);
    if (updateError) { setError("保存に失敗しました"); setSaving(false); return; }
    setOriginalHolidays(new Set(holidays));
    showToast("不定休を保存しました");
    setSaving(false);
  };

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(viewYear - 1); setViewMonth(12); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(viewYear + 1); setViewMonth(1); }
    else setViewMonth(viewMonth + 1);
  };

  const calendarDays = buildCalendar(viewYear, viewMonth, businessHours, holidays);
  const monthHolidayCount = calendarDays.filter((d) => d.isCurrentMonth && d.isIrregularHoliday).length;

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="不定休設定" backLabel="設定" backHref="/settings"
        breadcrumbs={[{ label: "設定", href: "/settings" }, { label: "不定休設定" }]} />

      <p className="text-sm text-text-light">
        カレンダーの日付をタップして臨時休業日を設定できます。
        曜日ごとの定休日は<a href="/settings/business-hours" className="text-accent hover:underline">営業時間設定</a>で変更できます。
      </p>

      {error && <ErrorAlert message={error} />}

      <HolidayCalendarGrid
        viewYear={viewYear} viewMonth={viewMonth} calendarDays={calendarDays}
        onPrevMonth={prevMonth} onNextMonth={nextMonth} onToggleHoliday={toggleHoliday} />

      {/* サマリー */}
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

      <button type="button" onClick={handleSave} disabled={saving || !hasChanges}
        className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]">
        {saving ? "保存中..." : hasChanges ? "保存する" : "変更なし"}
      </button>
    </div>
  );
}
