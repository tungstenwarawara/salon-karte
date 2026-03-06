"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { HelpTip } from "@/components/ui/help-tip";
import type { BookingSettings } from "@/types/database";

const LEAD_TIME_OPTIONS = [
  { value: 0, label: "制限なし" },
  { value: 30, label: "30分前まで" },
  { value: 60, label: "1時間前まで" },
  { value: 120, label: "2時間前まで" },
  { value: 180, label: "3時間前まで" },
] as const;

const CONCURRENT_OPTIONS = [
  { value: 1, label: "1（同時予約なし）" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
] as const;

const ADVANCE_HOURS_OPTIONS = [
  { value: 0, label: "制限なし" },
  { value: 1, label: "1時間前まで" },
  { value: 2, label: "2時間前まで" },
  { value: 3, label: "3時間前まで" },
  { value: 6, label: "6時間前まで" },
  { value: 12, label: "12時間前まで" },
  { value: 24, label: "24時間前（前日）まで" },
  { value: 48, label: "48時間前（2日前）まで" },
] as const;

const CHANGE_DEADLINE_OPTIONS = [
  { value: 0, label: "制限なし（いつでも可）" },
  { value: 1, label: "1時間前まで" },
  { value: 2, label: "2時間前まで" },
  { value: 3, label: "3時間前まで" },
  { value: 6, label: "6時間前まで" },
  { value: 12, label: "12時間前まで" },
  { value: 24, label: "24時間前（前日）まで" },
  { value: 48, label: "48時間前（2日前）まで" },
] as const;

const DEFAULT_SETTINGS: BookingSettings = {
  same_day_enabled: true,
  lead_time_minutes: 0,
  max_concurrent_appointments: 1,
};

export default function BookingRulesPage() {
  const [settings, setSettings] = useState<BookingSettings>(DEFAULT_SETTINGS);
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { user, salonId: sid } = await getClientAuth();
      if (!user || !sid) return;
      setSalonId(sid);

      const supabase = createClient();
      const { data } = await supabase
        .from("salons")
        .select("booking_settings")
        .eq("id", sid)
        .single<{ booking_settings: BookingSettings | null }>();
      if (data?.booking_settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.booking_settings });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setError("");
    if (!salonId) { setError("認証エラー"); return; }
    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("salons")
      .update({ booking_settings: settings })
      .eq("id", salonId);
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

        {/* 受付締切時間 */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm">
            受付締切時間
            <HelpTip>例えば「2時間前まで」に設定すると、14時の予約は12時までしか受け付けません。準備時間が必要な場合に設定してください。</HelpTip>
          </h3>
          <p className="text-xs text-text-light">
            予約の何時間前まで受け付けるか（当日以外も適用）
          </p>
          <select
            value={settings.min_advance_hours ?? 0}
            onChange={(e) =>
              setSettings({ ...settings, min_advance_hours: Number(e.target.value) })
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors min-h-[48px]"
          >
            {ADVANCE_HOURS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 同時予約数の上限 */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm">
            同時予約数の上限
            <HelpTip>お一人で運営されている場合は「1」のままで大丈夫です。スタッフが複数いる場合やベッドが複数ある場合に数を増やしてください。</HelpTip>
          </h3>
          <p className="text-xs text-text-light">
            同じ時間帯に受けられる予約の最大数
          </p>
          <select
            value={settings.max_concurrent_appointments}
            onChange={(e) =>
              setSettings({ ...settings, max_concurrent_appointments: Number(e.target.value) })
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors min-h-[48px]"
          >
            {CONCURRENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* キャンセル・変更締切 */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm">
            キャンセル・変更締切
            <HelpTip>お客様がWeb予約ページからキャンセル・変更できる期限です。「制限なし」だと直前でも変更可能です。ドタキャンを防ぎたい場合は「24時間前」などに設定してください。</HelpTip>
          </h3>
          <p className="text-xs text-text-light">
            お客様がWeb予約のキャンセル・変更をできる期限
          </p>
          <select
            value={settings.change_deadline_hours ?? 0}
            onChange={(e) =>
              setSettings({ ...settings, change_deadline_hours: Number(e.target.value) })
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors min-h-[48px]"
          >
            {CHANGE_DEADLINE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <SubmitButton type="button" onClick={handleSave} loading={saving} className="w-full" />
    </div>
  );
}
