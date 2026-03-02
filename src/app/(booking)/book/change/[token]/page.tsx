"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BookingMenuSelector } from "@/components/booking/booking-menu-selector";
import { BookingDatePicker } from "@/components/booking/booking-date-picker";
import type { BusinessHours, HourOverrides } from "@/types/database";

type Menu = { id: string; name: string; price: number; duration_minutes: number };

type AppointmentData = {
  appointmentDate: string;
  startTime: string;
  status: string;
  menuName: string | null;
  currentMenuIds: string[];
};

type SalonData = {
  name: string;
  bookingSlug: string | null;
  bookingEnabled: boolean;
  businessHours: BusinessHours | null;
  salonHolidays: string[] | null;
  hourOverrides: HourOverrides | null;
};

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = DAY_NAMES[d.getUTCDay()];
  return `${month}月${day}日（${dow}）`;
}

export default function ChangePage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [deadlinePassed, setDeadlinePassed] = useState(false);

  // フォーム状態
  const [step, setStep] = useState(0); // 0=現在の予約表示, 1=メニュー, 2=日時, 3=確認
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/booking/change?token=${token}`);
      if (!res.ok) {
        setError("予約が見つかりません");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAppointment(data.appointment);
      setSalon(data.salon);
      setMenus(data.menus ?? []);
      setDeadlinePassed(data.deadlinePassed);
      // 現在のメニューをデフォルト選択
      setSelectedMenuIds(data.appointment.currentMenuIds ?? []);
      setSelectedDate(data.appointment.appointmentDate ?? "");
      setSelectedTime("");
    } catch {
      setError("通信エラーが発生しました");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedMenus = menus.filter((m) => selectedMenuIds.includes(m.id));
  const totalDuration = selectedMenus.reduce((s, m) => s + (m.duration_minutes ?? 60), 0);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/booking/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          date: selectedDate,
          start_time: selectedTime,
          menu_ids: selectedMenuIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "変更に失敗しました");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("通信エラーが発生しました。再度お試しください。");
    }
    setSubmitting(false);
  };

  // ローディング
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // エラー（予約が見つからない等）
  if (error && !appointment) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">{error}</h1>
        <p className="text-text-light text-sm">URLが無効か、予約が見つかりません。</p>
      </div>
    );
  }

  // 変更不可の状態
  if (appointment?.status === "cancelled") {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-xl font-bold">この予約はキャンセル済みです</h1>
        {salon?.bookingSlug && (
          <Link href={`/book/${salon.bookingSlug}`} className="inline-block text-sm text-accent hover:underline font-medium">
            再度予約する
          </Link>
        )}
      </div>
    );
  }

  if (appointment?.status === "completed") {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-xl font-bold">この予約は完了しています</h1>
        <p className="text-text-light text-sm">完了した予約は変更できません。</p>
      </div>
    );
  }

  // 締切切れ
  if (deadlinePassed) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">変更受付期限を過ぎています</h1>
        <p className="text-text-light text-sm leading-relaxed">
          変更・キャンセルはサロンへ直接ご連絡ください。
        </p>
      </div>
    );
  }

  // 変更完了画面
  if (done) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">予約を変更しました</h1>
          <p className="text-text-light text-sm leading-relaxed">
            変更確認メールをお送りしました。
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-left space-y-1">
          <p className="text-sm">
            <span className="font-medium">日時:</span> {formatDate(selectedDate)} {selectedTime}〜
          </p>
          <p className="text-sm">
            <span className="font-medium">メニュー:</span> {selectedMenus.map((m) => m.name).join("、")}
          </p>
        </div>
      </div>
    );
  }

  const STEPS = ["現在の予約", "メニュー", "日時", "確認"];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">{salon?.name}</h1>
        <p className="text-sm text-text-light mt-1">予約の変更</p>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-1.5">
        {STEPS.map((label, i) => {
          const isDone = step > i;
          const active = step >= i;
          return (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-accent text-white" : "bg-border/30 text-text-light"}`}>
                {isDone ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : i + 1}
              </div>
              {i < 3 && <div className={`w-5 h-0.5 ${isDone ? "bg-accent" : "bg-border/30"}`} />}
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm font-medium">{STEPS[step]}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step 0: 現在の予約を表示 */}
      {step === 0 && appointment && (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
            <p className="text-xs text-text-light font-bold">現在の予約</p>
            <p className="text-sm">
              <span className="font-medium">日時:</span> {formatDate(appointment.appointmentDate)} {appointment.startTime.slice(0, 5)}〜
            </p>
            {appointment.menuName && (
              <p className="text-sm">
                <span className="font-medium">メニュー:</span> {appointment.menuName}
              </p>
            )}
          </div>
          <p className="text-xs text-text-light text-center">変更したい内容を選び直してください</p>
        </div>
      )}

      {/* Step 1: メニュー選択 */}
      {step === 1 && <BookingMenuSelector menus={menus} selectedIds={selectedMenuIds} onChange={setSelectedMenuIds} />}

      {/* Step 2: 日時選択 */}
      {step === 2 && salon?.bookingSlug && (
        <BookingDatePicker
          slug={salon.bookingSlug}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          totalDuration={totalDuration}
          onDateChange={(d) => { setSelectedDate(d); setSelectedTime(""); }}
          onTimeChange={setSelectedTime}
          businessHours={salon.businessHours}
          salonHolidays={salon.salonHolidays}
          hourOverrides={salon.hourOverrides}
        />
      )}

      {/* Step 3: 確認 */}
      {step === 3 && appointment && (
        <div className="space-y-4">
          {/* 変更前 */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-1 opacity-60">
            <p className="text-xs text-text-light font-bold">変更前</p>
            <p className="text-sm line-through text-text-light">
              {formatDate(appointment.appointmentDate)} {appointment.startTime.slice(0, 5)}〜 / {appointment.menuName}
            </p>
          </div>
          <div className="text-center text-accent font-bold">↓</div>
          {/* 変更後 */}
          <div className="bg-surface border border-accent/30 rounded-xl p-4 space-y-1">
            <p className="text-xs text-accent font-bold">変更後</p>
            <p className="text-sm">
              <span className="font-medium">日時:</span> {formatDate(selectedDate)} {selectedTime}〜
            </p>
            <p className="text-sm">
              <span className="font-medium">メニュー:</span> {selectedMenus.map((m) => m.name).join("、")}
            </p>
            <p className="text-sm text-text-light">
              合計 ¥{selectedMenus.reduce((s, m) => s + m.price, 0).toLocaleString()} / {totalDuration}分
            </p>
          </div>
        </div>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => { setStep(step - 1); setError(""); }}
            className="flex-1 rounded-xl border border-border bg-white px-4 py-3 font-medium min-h-[48px] transition-colors hover:bg-surface"
          >
            戻る
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => { setStep(step + 1); setError(""); }}
            disabled={step === 1 && selectedMenuIds.length === 0 || step === 2 && (!selectedDate || !selectedTime)}
            className="flex-1 rounded-xl bg-accent text-white px-4 py-3 font-bold min-h-[48px] transition-colors hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-accent text-white px-4 py-3 font-bold min-h-[48px] transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            {submitting ? "変更中..." : "予約を変更する"}
          </button>
        )}
      </div>
    </div>
  );
}
