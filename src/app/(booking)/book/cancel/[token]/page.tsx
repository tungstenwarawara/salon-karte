"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type AppointmentInfo = {
  appointmentDate: string;
  startTime: string;
  status: string;
  menuName: string | null;
  salonName: string;
  bookingSlug: string | null;
};

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = DAY_NAMES[d.getUTCDay()];
  return `${month}月${day}日（${dow}）`;
}

export default function CancelPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<AppointmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/booking/cancel?token=${token}`);
      if (!res.ok) {
        setError("予約が見つかりません");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setInfo(data);
      setLoading(false);
    };
    load();
  }, [token]);

  const handleCancel = async () => {
    setCancelling(true);
    setError("");

    const res = await fetch("/api/booking/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "キャンセルに失敗しました");
      setCancelling(false);
      return;
    }

    setDone(true);
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // キャンセル完了画面
  if (done && info) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">予約をキャンセルしました</h1>
          <p className="text-text-light text-sm leading-relaxed">
            キャンセル確認メールをお送りしました。
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-left space-y-1">
          <p className="text-sm text-text-light">
            <span className="font-medium text-text">日時:</span> {formatDate(info.appointmentDate)} {info.startTime.slice(0, 5)}〜
          </p>
          {info.menuName && (
            <p className="text-sm text-text-light">
              <span className="font-medium text-text">メニュー:</span> {info.menuName}
            </p>
          )}
        </div>
        {info.bookingSlug && (
          <Link
            href={`/book/${info.bookingSlug}`}
            className="inline-block text-sm text-accent hover:underline font-medium"
          >
            再度予約する
          </Link>
        )}
      </div>
    );
  }

  // エラー画面（予約が見つからない等）
  if (error && !info) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">{error}</h1>
        <p className="text-text-light text-sm">
          URLが無効か、すでにキャンセル済みの可能性があります。
        </p>
      </div>
    );
  }

  // すでにキャンセル済みの場合
  if (info?.status === "cancelled") {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">この予約はすでにキャンセル済みです</h1>
        {info.bookingSlug && (
          <Link
            href={`/book/${info.bookingSlug}`}
            className="inline-block text-sm text-accent hover:underline font-medium"
          >
            再度予約する
          </Link>
        )}
      </div>
    );
  }

  // 完了済みの場合
  if (info?.status === "completed") {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-xl font-bold">この予約は完了しています</h1>
        <p className="text-text-light text-sm">完了した予約はキャンセルできません。</p>
      </div>
    );
  }

  // キャンセル確認画面
  return (
    <div className="py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">予約のキャンセル</h1>
        <p className="text-text-light text-sm">
          以下の予約をキャンセルしますか？
        </p>
      </div>

      {info && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-text-light font-bold">予約内容</p>
          <p className="text-sm">
            <span className="font-medium">サロン:</span> {info.salonName}
          </p>
          <p className="text-sm">
            <span className="font-medium">日時:</span> {formatDate(info.appointmentDate)} {info.startTime.slice(0, 5)}〜
          </p>
          {info.menuName && (
            <p className="text-sm">
              <span className="font-medium">メニュー:</span> {info.menuName}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
        >
          {cancelling ? "キャンセル中..." : "予約をキャンセルする"}
        </button>

        {info?.bookingSlug && (
          <Link
            href={`/book/${info.bookingSlug}`}
            className="block w-full text-center text-sm text-text-light py-2 min-h-[48px] leading-[48px]"
          >
            戻る
          </Link>
        )}
      </div>
    </div>
  );
}
