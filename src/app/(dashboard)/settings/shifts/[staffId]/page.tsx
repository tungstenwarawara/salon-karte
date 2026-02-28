"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import type { BusinessHours, DaySchedule } from "@/types/database";
import {
  ORDERED_DAYS, DAY_LABELS, DEFAULT_BUSINESS_HOURS,
  generateTimeOptions, timeToMinutes,
} from "@/lib/business-hours";

const TIME_OPTIONS = generateTimeOptions();

export default function StaffDefaultSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.staffId as string;
  const [staffName, setStaffName] = useState("");
  const [salonId, setSalonId] = useState("");
  const [salonBH, setSalonBH] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [schedule, setSchedule] = useState<BusinessHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  // 表示用: 現在の有効スケジュール（個別設定があればそれ、なければサロン設定）
  const effectiveSchedule = schedule ?? salonBH;
  const hasCustomSchedule = schedule !== null;

  useEffect(() => {
    const load = async () => {
      const { user, salonId: sid } = await getClientAuth();
      if (!user || !sid) return;
      setSalonId(sid);

      const supabase = createClient();
      const [staffRes, salonRes] = await Promise.all([
        supabase.from("staff").select("name, default_schedule").eq("id", staffId).eq("salon_id", sid).single<{ name: string; default_schedule: BusinessHours | null }>(),
        supabase.from("salons").select("business_hours").eq("id", sid).single<{ business_hours: BusinessHours | null }>(),
      ]);

      if (!staffRes.data) { router.push("/settings/shifts"); return; }

      setStaffName(staffRes.data.name);
      setSchedule(staffRes.data.default_schedule);
      setSalonBH(salonRes.data?.business_hours ?? DEFAULT_BUSINESS_HOURS);
      setLoading(false);
    };
    load();
  }, [staffId, router]);

  const updateDay = (day: keyof BusinessHours, field: keyof DaySchedule, value: string | boolean) => {
    // 初回変更時: サロン設定をコピーしてから変更
    const base = schedule ?? { ...salonBH };
    setSchedule({
      ...base,
      [day]: { ...base[day], [field]: value },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (schedule) {
      for (const day of ORDERED_DAYS) {
        const s = schedule[day];
        if (s.is_open && timeToMinutes(s.close_time) <= timeToMinutes(s.open_time)) {
          setError(`${DAY_LABELS[day]}の終了時間は開始時間より後にしてください`);
          return;
        }
      }
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("staff").update({ default_schedule: schedule }).eq("id", staffId).eq("salon_id", salonId);

    if (updateError) {
      setError(`保存に失敗しました: ${updateError.message}`);
    } else {
      showToast("デフォルトスケジュールを保存しました");
    }
    setSaving(false);
  };

  const resetToSalon = async () => {
    setSchedule(null);
    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("staff").update({ default_schedule: null }).eq("id", staffId).eq("salon_id", salonId);

    if (updateError) {
      setError(`リセットに失敗しました: ${updateError.message}`);
    } else {
      showToast("サロン設定に戻しました");
    }
    setSaving(false);
  };

  const selectClass = "rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  if (loading) return null;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title={`${staffName}のスケジュール`}
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "シフト管理", href: "/settings/shifts" },
          { label: staffName },
        ]}
      />

      {/* バナー */}
      <div className={`rounded-xl p-3 text-sm ${hasCustomSchedule ? "bg-accent/10 text-accent" : "bg-gray-50 text-text-light"}`}>
        {hasCustomSchedule ? "個別のスケジュールが設定されています" : "サロン営業時間に従っています（変更すると個別設定になります）"}
      </div>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          {ORDERED_DAYS.map((day) => {
            const daySchedule = effectiveSchedule[day];
            return (
              <div key={day} className={`rounded-xl p-3 transition-colors ${daySchedule.is_open ? "bg-background" : "bg-gray-50"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${daySchedule.is_open ? "text-text" : "text-text-light"}`}>
                    {DAY_LABELS[day]}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateDay(day, "is_open", !daySchedule.is_open)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${daySchedule.is_open ? "bg-accent" : "bg-border"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${daySchedule.is_open ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {daySchedule.is_open ? (
                  <div className="flex items-center gap-2 mt-2">
                    <select value={daySchedule.open_time} onChange={(e) => updateDay(day, "open_time", e.target.value)} className={selectClass}>
                      {TIME_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <span className="text-text-light text-sm">〜</span>
                    <select value={daySchedule.close_time} onChange={(e) => updateDay(day, "close_time", e.target.value)} className={selectClass}>
                      {TIME_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-text-light mt-1.5">休み</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 bg-surface border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]">
            キャンセル
          </button>
          <SubmitButton loading={saving} className="flex-1" />
        </div>
      </form>

      {/* サロン設定に戻すボタン */}
      {hasCustomSchedule && (
        <button
          type="button"
          onClick={resetToSalon}
          disabled={saving}
          className="w-full text-sm text-text-light hover:text-error py-2 transition-colors min-h-[44px]"
        >
          サロン設定に戻す
        </button>
      )}
    </div>
  );
}
