"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { BusinessHours, BookingSettings, HourOverrides } from "@/types/database";
import { BookingMenuSelector } from "./booking-menu-selector";
import { BookingDatePicker } from "./booking-date-picker";
import { BookingCustomerForm } from "./booking-customer-form";
import { BookingConfirmation } from "./booking-confirmation";

type Menu = { id: string; name: string; price: number; duration_minutes: number };

type Props = { slug: string };

const STEPS = ["メニュー", "日時", "お客様情報", "確認"];

export function BookingPageClient({ slug }: Props) {
  const router = useRouter();
  // サロン情報（APIから取得）
  const [salonName, setSalonName] = useState("");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [salonHolidays, setSalonHolidays] = useState<string[] | null>(null);
  const [hourOverrides, setHourOverrides] = useState<HourOverrides | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // フォーム状態
  const [step, setStep] = useState(1);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [memo, setMemo] = useState("");
  const [hp, setHp] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 初回ロード: API からサロン情報取得
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/booking/${slug}`);
        if (!res.ok) {
          if (res.status === 403) { setDisabled(true); } else { setNotFound(true); }
          setPageLoading(false);
          return;
        }
        const data = await res.json();
        setSalonName(data.salon?.name ?? "");
        setMenus(data.menus ?? []);
        setBusinessHours(data.businessHours ?? null);
        setBookingSettings(data.bookingSettings ?? null);
        setSalonHolidays(data.salonHolidays ?? null);
        setHourOverrides(data.hourOverrides ?? null);
      } catch { setNotFound(true); }
      setPageLoading(false);
    };
    load();
  }, [slug]);

  const selectedMenus = menus.filter((m) => selectedMenuIds.includes(m.id));
  const totalDuration = selectedMenus.reduce((s, m) => s + (m.duration_minutes ?? 60), 0);

  const canNext = (): boolean => {
    switch (step) {
      case 1: return selectedMenuIds.length > 0;
      case 2: return !!selectedDate && !!selectedTime;
      case 3: return !!lastName.trim() && !!firstName.trim() && !!email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && !!phone.trim() && agreedToPrivacy;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/booking/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate, start_time: selectedTime, menu_ids: selectedMenuIds,
          last_name: lastName.trim(), first_name: firstName.trim(),
          email: email.trim(), phone: phone.replace(/-/g, "").trim(),
          memo: memo.trim() || undefined, _hp: hp || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "予約に失敗しました"); setSubmitting(false); return; }
      // 完了ページで検証できるようフラグを保存
      try { sessionStorage.setItem("booking_completed", slug); } catch { /* SSR */ }
      router.push(`/book/${slug}/complete`);
    } catch {
      setError("通信エラーが発生しました。再度お試しください。");
      setSubmitting(false);
    }
  };

  // ローディング
  if (pageLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-border/30 rounded-lg w-40 mx-auto" />
        <div className="h-4 bg-border/30 rounded w-24 mx-auto" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-border/30 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // 受付停止中
  if (disabled) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold mb-2">現在、予約の受付を停止しています</h1>
        <p className="text-sm text-text-light leading-relaxed">
          ご不便をおかけして申し訳ございません。<br />
          ご予約はサロンへ直接お問い合わせください。
        </p>
      </div>
    );
  }

  // 404
  if (notFound) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-border/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-text-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold mb-2">予約ページが見つかりません</h1>
        <p className="text-sm text-text-light">URLをご確認ください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">{salonName}</h1>
        <p className="text-sm text-text-light mt-1">オンライン予約</p>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-1.5">
        {STEPS.map((label, i) => {
          const done = step > i + 1;
          const active = step >= i + 1;
          return (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-accent text-white" : "bg-border/30 text-text-light"}`}>
                {done ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : i + 1}
              </div>
              {i < 3 && <div className={`w-5 h-0.5 ${done ? "bg-accent" : "bg-border/30"}`} />}
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm font-medium">{STEPS[step - 1]}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
      )}

      {step === 1 && <BookingMenuSelector menus={menus} selectedIds={selectedMenuIds} onChange={setSelectedMenuIds} />}
      {step === 2 && (
        <BookingDatePicker slug={slug} selectedDate={selectedDate} selectedTime={selectedTime} totalDuration={totalDuration}
          onDateChange={(d) => { setSelectedDate(d); setSelectedTime(""); }} onTimeChange={setSelectedTime}
          businessHours={businessHours} salonHolidays={salonHolidays} hourOverrides={hourOverrides} />
      )}
      {step === 3 && (
        <BookingCustomerForm lastName={lastName} firstName={firstName} email={email} phone={phone} memo={memo} hp={hp}
          agreedToPrivacy={agreedToPrivacy} onLastNameChange={setLastName} onFirstNameChange={setFirstName} onEmailChange={setEmail}
          onPhoneChange={setPhone} onMemoChange={setMemo} onHpChange={setHp} onAgreedToPrivacyChange={setAgreedToPrivacy} />
      )}
      {step === 4 && (
        <BookingConfirmation selectedMenus={selectedMenus} date={selectedDate} time={selectedTime}
          totalDuration={totalDuration} lastName={lastName} firstName={firstName} email={email} phone={phone} memo={memo} />
      )}

      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button type="button" onClick={() => { setStep(step - 1); setError(""); }} className="flex-1 rounded-xl border border-border bg-white px-4 py-3 font-medium min-h-[48px] transition-colors hover:bg-surface">
            戻る
          </button>
        )}
        {step < 4 ? (
          <button type="button" onClick={() => { setStep(step + 1); setError(""); }} disabled={!canNext()} className="flex-1 rounded-xl bg-accent text-white px-4 py-3 font-bold min-h-[48px] transition-colors hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed">
            次へ
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-xl bg-accent text-white px-4 py-3 font-bold min-h-[48px] transition-colors hover:bg-accent-light disabled:opacity-60">
            {submitting ? "送信中..." : "予約する"}
          </button>
        )}
      </div>
    </div>
  );
}
