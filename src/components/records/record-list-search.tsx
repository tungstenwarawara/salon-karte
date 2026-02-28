"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateShort } from "@/lib/format";
import { RecordListFilters, type PeriodFilter } from "./record-list-filters";

type RecordItem = {
  id: string;
  treatmentDate: string;
  menuName: string;
  customerName: string;
};

function getDateRange(period: PeriodFilter): { start: string; end: string } | null {
  if (period === "all") return null;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case "this_month":
      return {
        start: `${y}-${String(m + 1).padStart(2, "0")}-01`,
        end: `${y}-${String(m + 1).padStart(2, "0")}-31`,
      };
    case "last_month": {
      const d = new Date(y, m - 1, 1);
      return {
        start: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
        end: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-31`,
      };
    }
    case "3months": {
      const d = new Date(y, m - 2, 1);
      return {
        start: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
        end: `${y}-${String(m + 1).padStart(2, "0")}-31`,
      };
    }
  }
}

const PAGE_SIZE = 20;

export function RecordListSearch({ records }: { records: RecordItem[] }) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const resetPagination = () => setDisplayCount(PAGE_SIZE);

  // 期間フィルター
  const range = getDateRange(period);
  const afterPeriod = range
    ? records.filter((r) => r.treatmentDate >= range.start && r.treatmentDate <= range.end)
    : records;

  // テキスト検索
  const filtered = query
    ? afterPeriod.filter(
        (r) => r.customerName.includes(query) || r.menuName.includes(query)
      )
    : afterPeriod;

  // ページネーション
  const displayed = filtered.slice(0, displayCount);
  const hasMore = filtered.length > displayCount;

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
          onChange={(e) => { setQuery(e.target.value); resetPagination(); }}
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
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text p-1"
            aria-label="検索をクリア"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 期間フィルター + 件数 */}
      <div className="flex items-center justify-between gap-2">
        <RecordListFilters
          period={period}
          onPeriodChange={(p) => { setPeriod(p); resetPagination(); }}
        />
        <span className="text-xs text-text-light whitespace-nowrap">
          {filtered.length}件
        </span>
      </div>

      {/* 結果 */}
      {filtered.length === 0 && (query || period !== "all") && (
        <p className="text-sm text-text-light text-center py-4">
          該当するカルテはありません
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
                className="block bg-surface border border-border rounded-xl p-3 hover:border-accent hover:shadow-sm active:scale-[0.98] transition-all duration-200"
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
          onClick={() => setDisplayCount((c) => c + PAGE_SIZE)}
          className="w-full text-center text-sm text-accent py-2 min-h-[44px]"
        >
          もっと見る（残り{filtered.length - displayCount}件）
        </button>
      )}
    </>
  );
}
