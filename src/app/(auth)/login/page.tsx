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
  const [showEmailHelp, setShowEmailHelp] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

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

    // メール確認済みかチェック（未確認ならログアウトして案内）
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email_confirmed_at) {
      await supabase.auth.signOut();
      setError("メールアドレスの確認が完了していません。登録時に届いた確認メールのリンクをクリックしてください。");
      setShowEmailHelp(true);
      setLoading(false);
      return;
    }

    // staff テーブルで所属サロン確認
    const userId = user.id;
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
        {/* 装飾ドットパターン */}
        <div className="login-dot-float absolute top-[15%] left-[12%] w-1.5 h-1.5 rounded-full bg-accent/15" />
        <div className="login-dot-float-slow absolute top-[25%] right-[18%] w-2 h-2 rounded-full bg-primary/10" />
        <div className="login-dot-float absolute bottom-[30%] left-[22%] w-1 h-1 rounded-full bg-accent/20" />
        <div className="login-dot-float-slow absolute top-[55%] right-[10%] w-1.5 h-1.5 rounded-full bg-warning/10" />
        <div className="login-dot-float absolute bottom-[20%] right-[30%] w-1 h-1 rounded-full bg-accent/10" />
        <div className="login-dot-float-slow absolute top-[40%] left-[8%] w-2.5 h-2.5 rounded-full bg-primary/[0.06]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* ビジュアルセクション */}
        <div className="animate-fade-in-up mb-10">
          <LoginVisual />
        </div>

        {/* ログインフォーム */}
        <form
          onSubmit={handleLogin}
          className="animate-fade-in-up animation-delay-200 relative bg-surface/80 backdrop-blur-md rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-border/60 p-6 space-y-5 login-form-glow"
        >
          {/* グラデーションアクセントライン */}
          <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

          {error && (
            <div className="bg-error/10 text-error text-sm rounded-xl p-3 animate-fade-in-up">
              {error}
            </div>
          )}

          {showEmailHelp && (
            <div className="bg-background rounded-xl p-4 space-y-3 animate-fade-in-up">
              <p className="text-xs text-text-light leading-relaxed">
                確認メールが届いていない場合は、再送できます。
                <br />
                <span className="text-amber-700 font-medium">
                  ※ docomo・au・softbank のメールアドレスは届きにくい場合があります
                </span>
              </p>
              {resendSuccess && (
                <p className="text-xs text-green-600 font-medium">確認メールを再送しました。メールをご確認ください。</p>
              )}
              <button
                type="button"
                onClick={async () => {
                  if (!email) return;
                  setResending(true);
                  setResendSuccess(false);
                  try {
                    const res = await fetch("/api/auth/resend-confirmation", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });
                    if (res.ok) setResendSuccess(true);
                  } catch { /* ignore */ }
                  setResending(false);
                }}
                disabled={resending || !email}
                className="text-sm text-accent font-medium hover:underline disabled:opacity-50 min-h-[44px]"
              >
                {resending ? "送信中..." : "確認メールを再送する"}
              </button>
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
          <div className="flex justify-center gap-4 pt-2 text-xs text-text-light/60">
            <Link href="/terms" className="hover:underline">利用規約</Link>
            <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
            <Link href="/tokusho" className="hover:underline">特定商取引法</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
