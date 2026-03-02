"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function BookingCompletePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    try {
      const flag = sessionStorage.getItem("booking_completed");
      if (flag === slug) {
        setVerified(true);
        sessionStorage.removeItem("booking_completed");
      } else {
        // 予約完了フラグがない場合は予約ページに戻す
        router.replace(`/book/${slug}`);
      }
    } catch {
      router.replace(`/book/${slug}`);
    }
  }, [slug, router]);

  if (!verified) return null;

  return (
    <div className="text-center py-12 space-y-6">
      {/* チェックマーク */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">予約を受け付けました</h1>
        <p className="text-text-light text-sm leading-relaxed">
          ご予約ありがとうございます。<br />
          確認メールをお送りしましたのでご確認ください。
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
        <p className="text-xs text-text-light">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
        <p className="text-xs text-text-light">
          キャンセル・変更はサロンへ直接ご連絡ください。
        </p>
      </div>

      <Link
        href={`/book/${slug}`}
        className="inline-block text-sm text-accent hover:underline font-medium"
      >
        別の予約を取る
      </Link>
    </div>
  );
}
