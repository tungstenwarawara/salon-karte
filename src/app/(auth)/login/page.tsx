"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoginVisual } from "@/components/ui/login-visual";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    // staff テーブルで所属サロン確認
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const { data: staffRecord } = await supabase
      .from("staff")
      .select("salon_id")
      .eq("auth_user_id", userId)
      .eq("is_active", true)
      .single();

    if (staffRecord) {
      router.push("/dashboard");
      return;
    }

    // フォールバック: owner_id で確認（移行期対応）
    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", userId)
      .single();

    router.push(salon ? "/dashboard" : "/setup");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* 背景の装飾グラデーション */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/[0.04] blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-warning/[0.04] blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* ビジュアルセクション */}
        <div className="animate-fade-in-up mb-10">
          <LoginVisual />
        </div>

        {/* ログインフォーム */}
        <form
          onSubmit={handleLogin}
          className="animate-fade-in-up animation-delay-200 bg-surface/80 backdrop-blur-sm rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-border/60 p-6 space-y-5"
        >
          {error && (
            <div className="bg-error/10 text-error text-sm rounded-xl p-3 animate-fade-in-up">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-text-light">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@salon.com"
              className="w-full rounded-xl border border-border/70 bg-background/60 px-4 py-3 text-text placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-text-light">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="パスワードを入力"
              className="w-full rounded-xl border border-border/70 bg-background/60 px-4 py-3 text-text placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light active:scale-[0.98] text-white font-medium rounded-xl py-3.5 transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 min-h-[48px] shadow-[0_2px_8px_rgba(196,149,106,0.25)]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                ログイン中...
              </span>
            ) : (
              "ログイン"
            )}
          </button>
        </form>

        {/* フッターリンク */}
        <div className="animate-fade-in-up animation-delay-400 text-center mt-8 space-y-3">
          <p className="text-sm text-text-light">
            アカウントをお持ちでない方は
            <Link href="/signup" className="text-accent font-medium ml-1 hover:underline">
              新規登録
            </Link>
          </p>
          <p>
            <Link href="/reset-password" className="text-sm text-text-light/70 hover:text-accent transition-colors duration-200">
              パスワードを忘れた方はこちら
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
