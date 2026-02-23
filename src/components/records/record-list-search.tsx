"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateShort } from "@/lib/format";

type RecordItem = {
  id: string;
  treatmentDate: string;
  menuName: string;
  customerName: string;
};

export function RecordListSearch({ records }: { records: RecordItem[] }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = query
    ? records.filter(
        (r) =>
          r.customerName.includes(query) ||
          r.menuName.includes(query)
      )
    : records;

  const INITIAL_COUNT = 20;
  const displayed = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hasMore = filtered.length > INITIAL_COUNT && !showAll;

  // 日付でグループ化
  const grouped: { date: string; items: RecordItem[] }[] = [];
  let currentDate = "";
  for (const r of displayed) {
    if (r.treatmentDate !== currentDate) {
      currentDate = r.treatmentDate;
      grouped.push({ date: currentDate, items: [] });
    }
    grouped[grouped.length - 1].items.push(r);
  }

  if (records.length === 0) return null;

  return (
    <>
      {/* 検索 */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowAll(false);
          }}
          placeholder="顧客名・メニュー名で検索"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 text-text-light absolute left-3 top-1/2 -translate-y-1/2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>

      {/* 結果 */}
      {filtered.length === 0 && query && (
        <p className="text-sm text-text-light text-center py-4">
          「{query}」に一致するカルテはありません
        </p>
      )}

      {grouped.map((group) => (
        <div key={group.date}>
          <p className="text-xs text-text-light font-medium mb-2 mt-4">
            {formatDateShort(group.date)}
          </p>
          <div className="space-y-2">
            {group.items.map((r) => (
              <Link
                key={r.id}
                href={`/records/${r.id}`}
                className="block bg-surface border border-border rounded-xl p-3 hover:border-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{r.customerName}</span>
                </div>
                <p className="text-xs text-text-light mt-0.5">{r.menuName}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center text-sm text-accent py-2 min-h-[44px]"
        >
          もっと見る（残り{filtered.length - INITIAL_COUNT}件）
        </button>
      )}
    </>
  );
}
