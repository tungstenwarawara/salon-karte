"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";

export function ReferralSection() {
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { salonId } = await getClientAuth();
      if (!salonId) return;

      const supabase = createClient();
      const [salonRes, referralRes] = await Promise.all([
        supabase.from("salons").select("referral_code").eq("id", salonId).single(),
        supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_salon_id", salonId),
      ]);

      if (salonRes.data) {
        setReferralCode(salonRes.data.referral_code);
      }
      setReferralCount(referralRes.count ?? 0);
      setLoading(false);
    };
    load();
  }, []);

  const referralUrl = referralCode
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : "";

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
      <h3 className="font-bold">友だちに紹介する</h3>
      <p className="text-sm text-text-light leading-relaxed">
        サロンオーナーのお知り合いに Salon Karte を紹介してください。
        あなた専用の紹介リンクから登録された方を、紹介実績として記録しています。
      </p>
      <p className="text-xs text-text-light bg-background rounded-xl p-3 leading-relaxed">
        紹介特典（スタンダードプラン1ヶ月無料）は準備中です。対応開始時に、すでに紹介実績のある方にも遡及して適用します。
      </p>

      {/* 紹介リンク */}
      <div>
        <label className="block text-sm font-medium mb-1.5">あなたの紹介リンク</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-3 transition-colors min-h-[48px] whitespace-nowrap"
          >
            {copied ? "コピーしました" : "コピー"}
          </button>
        </div>
      </div>

      {/* 紹介コード */}
      <div className="flex items-center gap-3 bg-background rounded-xl p-3">
        <span className="text-sm text-text-light">紹介コード:</span>
        <span className="font-mono font-bold text-lg tracking-wider">{referralCode}</span>
      </div>

      {/* 紹介実績 */}
      {referralCount > 0 && (
        <p className="text-sm text-text-light">
          紹介実績: <span className="font-bold text-text">{referralCount}件</span>
        </p>
      )}
    </div>
  );
}
