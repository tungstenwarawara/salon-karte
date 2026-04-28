"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/ui/brand-logo";
import { trackEvent } from "@/lib/analytics";

const CARRIER_DOMAINS = [
  "docomo.ne.jp",
  "ezweb.ne.jp",
  "au.com",
  "softbank.ne.jp",
  "i.softbank.jp",
  "ymobile.ne.jp",
];

function isCarrierEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return CARRIER_DOMAINS.some((d) => domain === d);
}

function SignupForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const showCarrierWarning = email.includes("@") && isCarrierEmail(email);

  // ページ表示時に sign_up_start を送信
  useEffect(() => {
    trackEvent({ name: "sign_up_start" });
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    if (password !== passwordConfirm) {
      setError("パスワードが一致しません");
      return;
    }

    if (!agreed) {
      setError("利用規約・プライバシーポリシー・特定商取引法に基づく表記への同意が必要です");
      document.getElementById("agree-checkbox")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    trackEvent({ name: "sign_up_form_submit" });

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          agreedTermsAt: new Date().toISOString(),
          termsVersion: "2026-03-01",
          refCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登録に失敗しました");
        setLoading(false);
        return;
      }

      // サインアップ成功
      trackEvent({ name: "sign_up_completed", params: { method: "email" } });

      // メール確認が必要（通常フロー）
      setEmailSent(true);
      setLoading(false);
    } catch (err) {
      console.error("サインアップエラー:", err);
      setError("ネットワークエラーが発生しました。もう一度お試しください。");
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    setResendSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "再送に失敗しました");
      } else {
        setResendSuccess(true);
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setResending(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-center mb-8">
            <h1 className="flex justify-center"><BrandLogo size="lg" /></h1>
          </div>
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 space-y-4">
            <h2 className="text-lg font-bold">確認メールを送信しました</h2>
            <p className="text-sm text-text-light">
              <span className="font-medium text-text">{email}</span>
              <br />
              に確認メールを送信しました。
              <br />
              メール内のリンクをクリックして登録を完了してください。
            </p>
            <div className="bg-background rounded-xl p-3 space-y-2">
              <p className="text-xs text-text-light leading-relaxed">
                メールが届かない場合は、迷惑メールフォルダもご確認ください。
              </p>
              {showCarrierWarning && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-2.5">
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    キャリアメール（docomo・au・softbank）は確認メールが届きにくい場合があります。
                    しばらく待っても届かない場合は、Gmail や Yahoo メールでの登録をおすすめします。
                  </p>
                </div>
              )}
            </div>
            {resendSuccess && (
              <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3">
                確認メールを再送しました
              </div>
            )}
            {error && (
              <div className="bg-error/10 text-error text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="text-sm text-accent font-medium hover:underline disabled:opacity-50 min-h-[44px]"
            >
              {resending ? "送信中..." : "確認メールを再送する"}
            </button>
            <Link
              href="/login"
              className="block text-sm text-text-light font-medium hover:underline mt-2"
            >
              ログインページに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="flex justify-center"><BrandLogo size="lg" /></h1>
          <p className="text-text-light mt-2">新規アカウント登録</p>
        </div>

        <form onSubmit={handleSignup} className="bg-surface rounded-2xl shadow-sm border border-border p-6 space-y-5">
          <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 text-center">
            <p className="text-sm text-text-light">
              初期費用0円 · クレジットカード不要 · いつでも解約OK
            </p>
          </div>

          {error && (
            <div className="bg-error/10 text-error text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@salon.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
            {showCarrierWarning && (
              <p className="mt-1.5 text-xs text-amber-700 bg-warning/10 rounded-lg px-3 py-2 leading-relaxed">
                キャリアメール（docomo・au・softbank）は確認メールが届かない場合があります。Gmail や Yahoo メールの利用をおすすめします。
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="8文字以上"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium mb-1.5">
              パスワード（確認）
            </label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              placeholder="もう一度入力"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>

          <label id="agree-checkbox" className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-accent flex-shrink-0"
            />
            <span className="text-xs text-text-light leading-relaxed">
              <Link href="/terms" target="_blank" className="text-accent underline">利用規約</Link>
              、
              <Link href="/privacy" target="_blank" className="text-accent underline">プライバシーポリシー</Link>
              、
              <Link href="/tokusho" target="_blank" className="text-accent underline">特定商取引法に基づく表記</Link>
              に同意します
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "登録中..." : "アカウントを作成"}
          </button>

          <p className="text-xs text-text-light text-center">
            おためしプランで無料スタート。必要になったら月額2,980円にアップグレード
          </p>
        </form>

        <p className="text-center text-sm text-text-light mt-6">
          すでにアカウントをお持ちの方は
          <Link href="/login" className="text-accent font-medium ml-1 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
