"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Toast, useToast } from "@/components/ui/toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { Database } from "@/types/database";

type Salon = Database["public"]["Tables"]["salons"]["Row"];

export default function SettingsPage() {
  const router = useRouter();
  const [salon, setSalon] = useState<{
    name: string;
    phone: string;
    address: string;
  }>({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("salons")
        .select("id, name, phone, address")
        .eq("owner_id", user.id)
        .single<Salon>();

      if (data) {
        setSalon({
          name: data.name,
          phone: data.phone ?? "",
          address: data.address ?? "",
        });
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("salons")
      .update({
        name: salon.name,
        phone: salon.phone || null,
        address: salon.address || null,
      })
      .eq("owner_id", user.id);

    if (error) {
      setError("保存に失敗しました");
    } else {
      showToast("サロン情報を保存しました");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <h2 className="text-xl font-bold">設定</h2>

      {/* Salon info */}
      <form onSubmit={handleSave} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold">サロン情報</h3>

        {error && <ErrorAlert message={error} />}

        <div>
          <label className="block text-sm font-medium mb-1.5">
            サロン名 <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={salon.name}
            onChange={(e) => setSalon({ ...salon, name: e.target.value })}
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">電話番号</label>
          <input
            type="tel"
            value={salon.phone}
            onChange={(e) => setSalon({ ...salon, phone: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">住所</label>
          <input
            type="text"
            value={salon.address}
            onChange={(e) => setSalon({ ...salon, address: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
        >
          {loading ? "保存中..." : "保存する"}
        </button>
      </form>

      {/* Business hours link */}
      <Link
        href="/settings/business-hours"
        className="block bg-surface border border-border rounded-2xl p-5 hover:border-accent transition-colors"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">営業時間設定</h3>
            <p className="text-sm text-text-light mt-1">
              曜日ごとの営業時間・休業日の設定
            </p>
          </div>
          <span className="text-text-light">→</span>
        </div>
      </Link>

      {/* Holidays link */}
      <Link
        href="/settings/holidays"
        className="block bg-surface border border-border rounded-2xl p-5 hover:border-accent transition-colors"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">不定休設定</h3>
            <p className="text-sm text-text-light mt-1">
              臨時休業日の設定
            </p>
          </div>
          <span className="text-text-light">→</span>
        </div>
      </Link>

      {/* Menu link */}
      <Link
        href="/settings/menus"
        className="block bg-surface border border-border rounded-2xl p-5 hover:border-accent transition-colors"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">施術メニュー管理</h3>
            <p className="text-sm text-text-light mt-1">
              施術メニューの追加・編集
            </p>
          </div>
          <span className="text-text-light">→</span>
        </div>
      </Link>

      {/* Guide link */}
      <Link
        href="/guide"
        className="block bg-surface border border-border rounded-2xl p-5 hover:border-accent transition-colors"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">使い方ガイド</h3>
            <p className="text-sm text-text-light mt-1">
              基本的な操作方法・よくある質問
            </p>
          </div>
          <span className="text-text-light">→</span>
        </div>
      </Link>

      {/* Logout */}
      <div className="pt-2">
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
          }}
          className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-600 py-3 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          ログアウト
        </button>
      </div>
    </div>
  );
}
