"use client";

import { useState } from "react";
import Link from "next/link";

type CustomerWithVisitInfo = {
  id: string;
  last_name: string;
  first_name: string;
  last_name_kana: string | null;
  first_name_kana: string | null;
  phone: string | null;
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

type Props = {
  customers: CustomerWithVisitInfo[];
};

/** 顧客一覧の検索・ソート・表示を担当するClient Component */
export function CustomerList({ customers }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("kana");

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
    <>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-bold">顧客一覧</h2>
          <span className="text-sm text-text-light">
            {search ? `${sorted.length}/${customers.length}名` : `${customers.length}名`}
          </span>
        </div>
        <Link
          href="/customers/new"
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[48px] flex items-center"
        >
          + 追加
        </Link>
      </div>

      {/* 検索 */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="名前・カナ・電話番号で検索"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text p-1"
            aria-label="検索をクリア"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ソート */}
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

      {/* 一覧 */}
      {sorted.length > 0 ? (
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
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          {search ? (
            <p className="text-text-light">該当する顧客が見つかりません</p>
          ) : (
            <>
              <p className="text-text-light">顧客が登録されていません</p>
              <Link
                href="/customers/new"
                className="inline-block mt-2 text-sm text-accent hover:underline font-medium"
              >
                最初のお客様を登録する →
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
