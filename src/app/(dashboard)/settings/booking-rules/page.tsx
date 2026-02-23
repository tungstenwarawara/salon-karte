"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { BookingSettings } from "@/types/database";

const LEAD_TIME_OPTIONS = [
  { value: 0, label: "制限なし" },
  { value: 30, label: "30分前まで" },
  { value: 60, label: "1時間前まで" },
  { value: 120, label: "2時間前まで" },
  { value: 180, label: "3時間前まで" },
] as const;

const DEFAULT_SETTINGS: BookingSettings = {
  same_day_enabled: true,
  lead_time_minutes: 0,
};

export default function BookingRulesPage() {
  const [settings, setSettings] = useState<BookingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("salons")
        .select("booking_settings")
        .eq("owner_id", user.id)
        .single<{ booking_settings: BookingSettings | null }>();
      if (data?.booking_settings) {
        setSettings(data.booking_settings);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setError("");
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: updateError } = await supabase
      .from("salons")
      .update({ booking_settings: settings })
      .eq("owner_id", user.id);
    if (updateError) {
      setError(`保存に失敗しました: ${updateError.message}`);
      console.error("booking_settings update error:", updateError);
    } else {
      showToast("予約受付設定を保存しました");
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title="予約受付設定"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "予約受付設定" },
        ]}
      />

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
        {error && <ErrorAlert message={error} />}

        {/* 当日予約 */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm">当日予約</h3>
          <p className="text-xs text-text-light">当日の予約を受け付けるかどうか</p>
          <div className="space-y-1.5">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/30 transition-colors cursor-pointer min-h-[48px]">
              <input
                type="radio"
                name="sameDayEnabled"
                checked={settings.same_day_enabled}
                onChange={() => setSettings({ ...settings, same_day_enabled: true })}
                className="w-5 h-5 accent-accent"
              />
              <span className="text-sm">受け付ける</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/30 transition-colors cursor-pointer min-h-[48px]">
              <input
                type="radio"
                name="sameDayEnabled"
                checked={!settings.same_day_enabled}
                onChange={() => setSettings({ ...settings, same_day_enabled: false, lead_time_minutes: 0 })}
                className="w-5 h-5 accent-accent"
              />
              <span className="text-sm">受け付けない</span>
            </label>
          </div>
        </div>

        {/* 予約締切（当日予約ONの場合のみ） */}
        {settings.same_day_enabled && (
          <div className="space-y-2">
            <h3 className="font-bold text-sm">予約締切</h3>
            <p className="text-xs text-text-light">施術開始の何分前まで予約を受け付けるか</p>
            <select
              value={settings.lead_time_minutes}
              onChange={(e) => setSettings({ ...settings, lead_time_minutes: Number(e.target.value) })}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors min-h-[48px]"
            >
              {LEAD_TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
      >
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
