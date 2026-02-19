"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type CustomerWithVisitInfo = Customer & {
  visit_count: number;
  last_visit_date: string | null;
};

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getVisitLabel(days: number | null): { text: string; color: string } | null {
  if (days === null) return { text: "未来店", color: "text-gray-400" };
  if (days >= 90) return { text: `${days}日前`, color: "text-red-500" };
  if (days >= 60) return { text: `${days}日前`, color: "text-orange-500" };
  if (days >= 30) return { text: `${days}日前`, color: "text-yellow-600" };
  return null;
}

type SortKey = "kana" | "last_visit" | "visit_count";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithVisitInfo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("kana");

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

    // 顧客と来店情報を並列取得（ウォーターフォール解消）
    const [customersResult, visitResult] = await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .eq("salon_id", salon.id)
        .order("last_name_kana", { ascending: true })
        .returns<Customer[]>(),
      supabase
        .from("treatment_records")
        .select("customer_id, treatment_date")
        .eq("salon_id", salon.id),
    ]);

    const customerData = customersResult.data;
    if (!customerData) {
      setLoading(false);
      return;
    }

    const visitData = visitResult.data;

    // Build visit stats map
    const visitMap = new Map<string, { count: number; lastDate: string | null }>();
    if (visitData) {
      for (const record of visitData) {
        const existing = visitMap.get(record.customer_id);
        if (existing) {
          existing.count++;
          if (!existing.lastDate || record.treatment_date > existing.lastDate) {
            existing.lastDate = record.treatment_date;
          }
        } else {
          visitMap.set(record.customer_id, {
            count: 1,
            lastDate: record.treatment_date,
          });
        }
      }
    }

    const customersWithVisits: CustomerWithVisitInfo[] = customerData.map((c) => {
      const visit = visitMap.get(c.id);
      return {
        ...c,
        visit_count: visit?.count ?? 0,
        last_visit_date: visit?.lastDate ?? null,
      };
    });

    setCustomers(customersWithVisits);
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

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "last_visit": {
        // Null last_visit goes to bottom
        if (!a.last_visit_date && !b.last_visit_date) return 0;
        if (!a.last_visit_date) return 1;
        if (!b.last_visit_date) return -1;
        return a.last_visit_date > b.last_visit_date ? -1 : 1;
      }
      case "visit_count":
        return b.visit_count - a.visit_count;
      case "kana":
      default:
        return (a.last_name_kana ?? "").localeCompare(b.last_name_kana ?? "");
    }
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

      {/* Sort */}
      <div className="flex gap-2">
        {([
          ["kana", "カナ順"],
          ["last_visit", "来店日順"],
          ["visit_count", "来店回数"],
        ] as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors min-h-[32px] ${
              sortBy === key
                ? "bg-accent text-white"
                : "bg-surface border border-border text-text-light"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center text-text-light py-8">読み込み中...</div>
      ) : sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((customer) => {
            const days = daysSince(customer.last_visit_date);
            const visitLabel = getVisitLabel(days);
            return (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="block bg-surface border border-border rounded-xl p-4 hover:border-accent transition-colors"
              >
                <div className="flex justify-between items-start">
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
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs text-text-light">
                      {customer.visit_count}回来店
                    </p>
                    {visitLabel && (
                      <p className={`text-xs font-medium ${visitLabel.color}`}>
                        {visitLabel.text}
                      </p>
                    )}
                    {!visitLabel && customer.last_visit_date && (
                      <p className="text-xs text-text-light">
                        {customer.last_visit_date}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
          {search ? "該当する顧客が見つかりません" : "顧客が登録されていません"}
        </div>
      )}
    </div>
  );
}
