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
  customerId: string;
};

type AppointmentInfo = {
  id: string;
  customerId: string;
  customerName: string;
  startTime: string;
};

type DisplayItem = {
  key: string;
  href: string;
  customerName: string;
  badge?: string;
  subtitle: string;
  group?: string;
};

function getLocalDateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildItems(
  period: PeriodFilter,
  records: RecordItem[],
  todayAppointments: AppointmentInfo[],
  tomorrowAppointments: AppointmentInfo[],
): DisplayItem[] {
  const todayStr = getLocalDateStr(0);
  const yesterdayStr = getLocalDateStr(-1);

  if (period === "yesterday") {
    return records
      .filter((r) => r.treatmentDate === yesterdayStr)
      .map((r) => ({ key: r.id, href: `/records/${r.id}`, customerName: r.customerName, subtitle: r.menuName, group: r.treatmentDate }));
  }

  if (period === "today") {
    const items: DisplayItem[] = [];
    const appointmentCustomerIds = new Set<string>();
    for (const appt of todayAppointments) {
      appointmentCustomerIds.add(appt.customerId);
      const latest = records.find((r) => r.customerId === appt.customerId);
      const isTodaysRecord = latest?.treatmentDate === todayStr;
      items.push({
        key: `appt-${appt.id}`,
        href: latest ? `/records/${latest.id}` : `/customers/${appt.customerId}`,
        customerName: appt.customerName,
        badge: appt.startTime.slice(0, 5),
        subtitle: latest
          ? isTodaysRecord ? latest.menuName : `前回 ${formatDateShort(latest.treatmentDate)} ${latest.menuName}`
          : "カルテなし",
      });
    }
    // 予約なしの当日カルテ（ウォークイン）
    for (const r of records) {
      if (r.treatmentDate === todayStr && !appointmentCustomerIds.has(r.customerId)) {
        items.push({ key: r.id, href: `/records/${r.id}`, customerName: r.customerName, subtitle: r.menuName });
      }
    }
    return items;
  }

  if (period === "tomorrow") {
    return tomorrowAppointments.map((appt) => {
      const latest = records.find((r) => r.customerId === appt.customerId);
      return {
        key: `appt-${appt.id}`,
        href: latest ? `/records/${latest.id}` : `/customers/${appt.customerId}`,
        customerName: appt.customerName,
        badge: appt.startTime.slice(0, 5),
        subtitle: latest ? `前回 ${formatDateShort(latest.treatmentDate)} ${latest.menuName}` : "カルテなし",
      };
    });
  }

  // 全期間
  return records.map((r) => ({ key: r.id, href: `/records/${r.id}`, customerName: r.customerName, subtitle: r.menuName, group: r.treatmentDate }));
}

const EMPTY_MESSAGES: Record<PeriodFilter, string> = {
  yesterday: "昨日のカルテはありません",
  today: "今日の予約・カルテはありません",
  tomorrow: "明日の予約はありません",
  all: "該当するカルテはありません",
};

const PAGE_SIZE = 20;

export function RecordListSearch({
  records,
  todayAppointments,
  tomorrowAppointments,
}: {
  records: RecordItem[];
  todayAppointments: AppointmentInfo[];
  tomorrowAppointments: AppointmentInfo[];
}) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const resetPagination = () => setDisplayCount(PAGE_SIZE);

  const allItems = buildItems(period, records, todayAppointments, tomorrowAppointments);
  const filtered = query
    ? allItems.filter((item) => item.customerName.includes(query) || item.subtitle.includes(query))
    : allItems;
  const displayed = filtered.slice(0, displayCount);
  const hasMore = filtered.length > displayCount;

  // 日付グループ化（group が設定されている場合のみ）
  const hasGroups = displayed.some((item) => item.group);
  const grouped: { date: string; items: DisplayItem[] }[] = [];
  if (hasGroups) {
    let currentDate = "";
    for (const item of displayed) {
      if (item.group !== currentDate) {
        currentDate = item.group!;
        grouped.push({ date: currentDate, items: [] });
      }
      grouped[grouped.length - 1].items.push(item);
    }
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-light absolute left-3 top-1/2 -translate-y-1/2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text p-1" aria-label="検索をクリア">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* フィルター + 件数 */}
      <div className="flex items-center justify-between gap-2">
        <RecordListFilters period={period} onPeriodChange={(p) => { setPeriod(p); resetPagination(); }} />
        <span className="text-xs text-text-light whitespace-nowrap">{filtered.length}件</span>
      </div>

      {/* 空状態 */}
      {filtered.length === 0 && (query || period !== "all") && (
        <p className="text-sm text-text-light text-center py-4">{EMPTY_MESSAGES[period]}</p>
      )}

      {/* グループ表示（昨日・全期間） */}
      {hasGroups && grouped.map((g) => (
        <div key={g.date}>
          <p className="text-xs text-text-light font-medium mb-2 mt-4">{formatDateShort(g.date)}</p>
          <div className="space-y-2">
            {g.items.map((item) => (
              <ItemCard key={item.key} item={item} />
            ))}
          </div>
        </div>
      ))}

      {/* フラット表示（今日・明日） */}
      {!hasGroups && displayed.length > 0 && (
        <div className="space-y-2">
          {displayed.map((item) => (
            <ItemCard key={item.key} item={item} />
          ))}
        </div>
      )}

      {hasMore && (
        <button onClick={() => setDisplayCount((c) => c + PAGE_SIZE)} className="w-full text-center text-sm text-accent py-2 min-h-[44px]">
          もっと見る（残り{filtered.length - displayCount}件）
        </button>
      )}
    </>
  );
}

function ItemCard({ item }: { item: DisplayItem }) {
  return (
    <Link
      href={item.href}
      className="block bg-surface border border-border rounded-xl p-3 hover:border-accent hover:shadow-sm active:scale-[0.98] transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{item.customerName}</span>
        {item.badge && <span className="text-xs text-accent font-medium">{item.badge}</span>}
      </div>
      <p className="text-xs text-text-light mt-0.5">{item.subtitle}</p>
    </Link>
  );
}
