"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/ui/brand-logo";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [agreed, setAgreed] = useState(false);

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
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          agreed_terms_at: new Date().toISOString(),
          terms_version: "2026-03-01",
        },
      },
    });

    if (error) {
      console.error("サインアップエラー:", error);
      setError(`登録に失敗しました: ${error.message}`);
      setLoading(false);
      return;
    }

    // If session exists immediately (email confirmation disabled), go to setup
    if (data.session) {
      router.push(refCode ? `/setup?ref=${encodeURIComponent(refCode)}` : "/setup");
      return;
    }

    // Email confirmation required
    setEmailSent(true);
    setLoading(false);
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
            <Link
              href="/login"
              className="block text-sm text-accent font-medium hover:underline mt-4"
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

          <label className="flex items-start gap-3 cursor-pointer">
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
            disabled={loading || !agreed}
            className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "登録中..." : "アカウントを作成"}
          </button>
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
