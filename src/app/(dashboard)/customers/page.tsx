"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single<{ id: string }>();
    if (!salon) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("salon_id", salon.id)
      .order("last_name_kana", { ascending: true })
      .returns<Customer[]>();

    setCustomers(data ?? []);
    setLoading(false);
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      `${c.last_name}${c.first_name}`.includes(s) ||
      `${c.last_name_kana ?? ""}${c.first_name_kana ?? ""}`
        .toLowerCase()
        .includes(s) ||
      (c.phone ?? "").includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">顧客一覧</h2>
        <Link
          href="/customers/new"
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[40px] flex items-center"
        >
          + 追加
        </Link>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="名前・カナ・電話番号で検索"
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
      />

      {/* List */}
      {loading ? (
        <div className="text-center text-text-light py-8">読み込み中...</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="block bg-surface border border-border rounded-xl p-4 hover:border-accent transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {customer.last_name} {customer.first_name}
                  </p>
                  {(customer.last_name_kana || customer.first_name_kana) && (
                    <p className="text-sm text-text-light">
                      {customer.last_name_kana} {customer.first_name_kana}
                    </p>
                  )}
                </div>
                <span className="text-text-light text-sm">
                  {customer.phone ?? ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
          {search ? "該当する顧客が見つかりません" : "顧客が登録されていません"}
        </div>
      )}
    </div>
  );
}
