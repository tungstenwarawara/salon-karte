"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerListFilters, type SortKey, type VisitFilter } from "./customer-list-filters";
import { CustomerCard } from "./customer-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PlanLimitModal } from "@/components/plan/plan-limit-modal";
import { PlanLimitWarning } from "@/components/plan/plan-limit-warning";
import { isAtLimit, type PlanType } from "@/lib/plan";

type CustomerWithVisitInfo = {
  id: string;
  last_name: string;
  first_name: string;
  last_name_kana: string | null;
  first_name_kana: string | null;
  phone: string | null;
  graduated_at: string | null;
  visit_count: number;
  last_visit_date: string | null;
};

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const PAGE_SIZE = 20;

type Props = {
  customers: CustomerWithVisitInfo[];
  planType: PlanType;
  hasReferralBenefit?: boolean;
};

/** 顧客一覧の検索・フィルター・ソート・表示を担当するClient Component */
export function CustomerList({ customers, planType, hasReferralBenefit = false }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("kana");
  const [visitFilter, setVisitFilter] = useState<VisitFilter>("all");
  const [hideGraduated, setHideGraduated] = useState(true);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // フリープラン制限チェック（卒業済み含む全顧客が対象）
  const customerCount = customers.length;
  const atLimit = isAtLimit(planType, "customers", customerCount);

  const resetPagination = () => setDisplayCount(PAGE_SIZE);

  // フィルター・検索・ソートのパイプライン
  const afterGraduated = hideGraduated
    ? customers.filter((c) => !c.graduated_at)
    : customers;

  const afterVisitFilter = visitFilter === "all"
    ? afterGraduated
    : afterGraduated.filter((c) => {
        const days = daysSince(c.last_visit_date);
        const threshold = parseInt(visitFilter);
        return days === null || days >= threshold;
      });

  const afterSearch = afterVisitFilter.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      `${c.last_name}${c.first_name}`.includes(s) ||
      `${c.last_name_kana ?? ""}${c.first_name_kana ?? ""}`.toLowerCase().includes(s) ||
      (c.phone ?? "").includes(s)
    );
  });

  const sorted = [...afterSearch].sort((a, b) => {
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

  const displayed = sorted.slice(0, displayCount);
  const hasMore = sorted.length > displayCount;
  const graduatedCount = customers.filter((c) => c.graduated_at).length;

  return (
    <>
      {/* 上限到達モーダル */}
      {showLimitModal && (
        <PlanLimitModal
          blockType={{ kind: "limit", type: "customers", current: customerCount }}
          hasReferralBenefit={hasReferralBenefit}
          onClose={() => setShowLimitModal(false)}
        />
      )}

      {/* 80%警告バナー */}
      <PlanLimitWarning
        planType={planType}
        type="customers"
        current={customerCount}
      />

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-bold">顧客一覧</h2>
          <span className="text-sm text-text-light">
            {sorted.length !== customers.length
              ? `${sorted.length}/${customers.length}名`
              : `${customers.length}名`}
          </span>
        </div>
        {atLimit ? (
          <button
            onClick={() => setShowLimitModal(true)}
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[48px] flex items-center"
          >
            + 顧客を登録
          </button>
        ) : (
          <Link
            href="/customers/new"
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[48px] flex items-center"
          >
            + 顧客を登録
          </Link>
        )}
      </div>

      {/* 検索 */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPagination(); }}
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

      {/* フィルター・ソート */}
      <CustomerListFilters
        visitFilter={visitFilter}
        onVisitFilterChange={(f) => { setVisitFilter(f); resetPagination(); }}
        sortBy={sortBy}
        onSortChange={setSortBy}
        hideGraduated={hideGraduated}
        onHideGraduatedChange={(v) => { setHideGraduated(v); resetPagination(); }}
        graduatedCount={graduatedCount}
      />

      {/* 一覧 */}
      {displayed.length > 0 ? (
        <div className="space-y-2">
          {displayed.map((c) => (
            <CustomerCard key={c.id} {...c} />
          ))}
        </div>
      ) : search || visitFilter !== "all" ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-light">該当する顧客が見つかりません</p>
        </div>
      ) : (
        <EmptyState
          illustration="customer"
          message="顧客が登録されていません"
          action={{ label: "最初のお客様を登録する →", href: "/customers/new" }}
        />
      )}

      {/* もっと見る */}
      {hasMore && (
        <button
          onClick={() => setDisplayCount((c) => c + PAGE_SIZE)}
          className="w-full text-center text-sm text-accent py-2 min-h-[44px]"
        >
          もっと見る（残り{sorted.length - displayCount}件）
        </button>
      )}
    </>
  );
}
