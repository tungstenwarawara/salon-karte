"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetupPage() {
  const router = useRouter();
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if salon already exists - redirect to dashboard if so
  useEffect(() => {
    const checkExistingSalon = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: salon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (salon) {
        router.push("/dashboard");
        return;
      }

      setChecking(false);
    };
    checkExistingSalon();
  }, [router]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("ログインセッションが切れました。再度ログインしてください");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("salons").insert({
      owner_id: user.id,
      name: salonName,
      phone: phone || null,
      address: address || null,
    });

    if (error) {
      setError("サロン情報の登録に失敗しました。もう一度お試しください");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-text-light">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">サロンカルテ</h1>
          <p className="text-text-light mt-2">サロン情報を登録しましょう</p>
        </div>

        <form onSubmit={handleSetup} className="bg-surface rounded-2xl shadow-sm border border-border p-6 space-y-5">
          {error && (
            <div className="bg-error/10 text-error text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="salonName" className="block text-sm font-medium mb-1.5">
              サロン名 <span className="text-error">*</span>
            </label>
            <input
              id="salonName"
              type="text"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              required
              placeholder="例: Beauty Salon Hana"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
              電話番号
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例: 03-1234-5678"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1.5">
              住所
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="例: 東京都渋谷区..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "登録中..." : "はじめる"}
          </button>
        </form>
      </div>
    </div>
  );
}
