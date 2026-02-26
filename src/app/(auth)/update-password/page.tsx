"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 招待フローかパスワードリセットかを判定
  const isInvite = searchParams.get("invite") === "1";

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
      setError("パスワードの設定に失敗しました。リンクの有効期限が切れている可能性があります。");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-primary">サロンカルテ</h1>
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
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
        >
          {loading ? "設定中..." : isInvite ? "パスワードを設定してはじめる" : "パスワードを更新"}
        </button>
      </form>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">サロンカルテ</h1>
            <p className="text-text-light mt-2">読み込み中...</p>
          </div>
        }>
          <UpdatePasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
