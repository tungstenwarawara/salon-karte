"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Salon = Database["public"]["Tables"]["salons"]["Row"];

export default function SettingsPage() {
  const [salon, setSalon] = useState<{
    name: string;
    phone: string;
    address: string;
  }>({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("salons")
        .select("*")
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
    setSaved(false);
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
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">設定</h2>

      {/* Salon info */}
      <form onSubmit={handleSave} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold">サロン情報</h3>

        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-success/10 text-success text-sm rounded-lg p-3">
            保存しました
          </div>
        )}

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
    </div>
  );
}
