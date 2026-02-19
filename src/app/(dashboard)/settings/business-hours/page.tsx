"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { BusinessHours, DaySchedule } from "@/types/database";
import {
  ORDERED_DAYS,
  DAY_LABELS,
  DEFAULT_BUSINESS_HOURS,
  generateTimeOptions,
  timeToMinutes,
} from "@/lib/business-hours";

const TIME_OPTIONS = generateTimeOptions();

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("salons")
        .select("business_hours")
        .eq("owner_id", user.id)
        .single<{ business_hours: BusinessHours | null }>();

      if (data?.business_hours) {
        setHours(data.business_hours);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateDay = (day: keyof BusinessHours, field: keyof DaySchedule, value: string | boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    // Validate: close_time > open_time for open days
    for (const day of ORDERED_DAYS) {
      const schedule = hours[day];
      if (schedule.is_open) {
        if (timeToMinutes(schedule.close_time) <= timeToMinutes(schedule.open_time)) {
          setError(`${DAY_LABELS[day]}の閉店時間は開店時間より後にしてください`);
          return;
        }
      }
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("salons")
      .update({ business_hours: hours })
      .eq("owner_id", user.id);

    if (updateError) {
      setError("保存に失敗しました");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const selectClass =
    "rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-40 bg-border rounded-lg animate-pulse" />
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-12 bg-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">営業時間設定</h2>
        <Link
          href="/settings"
          className="text-sm text-text-light hover:text-text transition-colors"
        >
          戻る
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-success/10 text-success text-sm rounded-lg p-3">
            保存しました
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          {ORDERED_DAYS.map((day) => {
            const schedule = hours[day];
            return (
              <div
                key={day}
                className={`rounded-xl p-3 transition-colors ${
                  schedule.is_open
                    ? "bg-background"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${schedule.is_open ? "text-text" : "text-text-light"}`}>
                    {DAY_LABELS[day]}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateDay(day, "is_open", !schedule.is_open)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      schedule.is_open ? "bg-accent" : "bg-border"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                        schedule.is_open ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {schedule.is_open ? (
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={schedule.open_time}
                      onChange={(e) => updateDay(day, "open_time", e.target.value)}
                      className={selectClass}
                    >
                      {TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-text-light text-sm">〜</span>
                    <select
                      value={schedule.close_time}
                      onChange={(e) => updateDay(day, "close_time", e.target.value)}
                      className={selectClass}
                    >
                      {TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-text-light mt-1.5">休業日</p>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </form>
    </div>
  );
}
