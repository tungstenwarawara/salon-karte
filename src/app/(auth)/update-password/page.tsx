"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/auth-errors";
import { BrandLogo } from "@/components/ui/brand-logo";

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // 招待フローかパスワードリセットかを判定
  const isInvite = searchParams.get("invite") === "1";

  // URL hash fragment からのセッション検出を待機
  // Supabase の招待メールは #access_token=... 形式でリダイレクトするため
  // createBrowserClient が自動的にセッションを検出・設定するのを待つ
  useEffect(() => {
    const supabase = createClient();

    // 既にセッションがある場合（callback経由など）
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
        return;
      }
    });

    // hash fragment からの非同期セッション検出を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // 5秒以内にセッションが検出されない場合はタイムアウト
    const timeout = setTimeout(() => {
      setSessionReady((prev) => {
        if (!prev) {
          setError("認証セッションの取得に失敗しました。招待メールのリンクをもう一度クリックしてください。");
        }
        return prev;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
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

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("パスワード設定エラー:", error);
      setError(translateAuthError(error.message));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="text-center mb-8">
      <h1 className="flex justify-center"><BrandLogo size="lg" /></h1>
      {isInvite ? (
        <>
          <p className="text-text-light mt-2">招待ありがとうございます！</p>
          <p className="text-text-light text-sm mt-1">
            ログイン用のパスワードを設定してください
          </p>
        </>
      ) : (
        <p className="text-text-light mt-2">新しいパスワードを設定</p>
      )}

      {!sessionReady && !error ? (
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 mt-8">
          <p className="text-text-light text-sm">認証情報を確認中...</p>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="bg-surface rounded-2xl shadow-sm border border-border p-6 space-y-5 mt-8 text-left">
          {error && (
            <div className="bg-error/10 text-error text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              {isInvite ? "パスワード" : "新しいパスワード"}
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
              {isInvite ? "パスワード（確認）" : "新しいパスワード（確認）"}
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

          <button
            type="submit"
            disabled={loading || !sessionReady}
            className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "設定中..." : isInvite ? "パスワードを設定してはじめる" : "パスワードを更新"}
          </button>
        </form>
      )}

      {isInvite && (
        <p className="text-center text-sm text-text-light mt-4">
          すでにパスワードを設定済みの方は
          <Link href="/login" className="text-accent font-medium ml-1 hover:underline">
            ログイン
          </Link>
        </p>
      )}
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="text-center">
            <h1 className="flex justify-center"><BrandLogo size="lg" /></h1>
            <p className="text-text-light mt-2">読み込み中...</p>
          </div>
        }>
          <UpdatePasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
