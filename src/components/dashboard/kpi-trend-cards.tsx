import Link from "next/link";
import { getChangePercent, formatYen } from "@/components/sales/sales-types";

type Props = {
  currentRevenue: number;
  previousRevenue: number;
  currentVisits: number;
  previousVisits: number;
  /** スタッフ権限の場合は売上カードを非表示 */
  staffRole: "owner" | "manager" | "staff" | null;
};

/** 今月 vs 先月のミニ比較バー */
function MiniComparisonBar({ current, previous }: { current: number; previous: number }) {
  const max = Math.max(current, previous, 1);
  const currentPct = Math.round((current / max) * 100);
  const previousPct = Math.round((previous / max) * 100);
  return (
    <div className="space-y-1 mt-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-text-light w-6 shrink-0">今月</span>
        <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${currentPct}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-text-light w-6 shrink-0">先月</span>
        <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
          <div className="h-full bg-primary/30 rounded-full transition-all duration-700" style={{ width: `${previousPct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function KpiTrendCards({
  currentRevenue,
  previousRevenue,
  currentVisits,
  previousVisits,
  staffRole,
}: Props) {
  const revenueChange = getChangePercent(currentRevenue, previousRevenue);
  const visitChange = getChangePercent(currentVisits, previousVisits);
  // オーナー・マネージャーのみ売上を表示（staffロールには非表示）
  const canSeeRevenue = staffRole !== "staff";

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 今月の売上（オーナー/マネージャーのみ） */}
      {canSeeRevenue && (
        <Link
          href="/sales"
          className="bg-surface border border-border rounded-2xl p-4 shadow-card hover:shadow-card-hover hover:border-accent hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-accent">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              {revenueChange && (
                <span className={`text-xs font-medium ${revenueChange.color}`}>
                  {revenueChange.text}
                  <span className="text-text-light font-normal ml-0.5">先月比</span>
                </span>
              )}
            </div>
            <p className="text-lg font-bold truncate">{formatYen(currentRevenue)}</p>
            <p className="text-xs text-text-light">今月の売上</p>
            <MiniComparisonBar current={currentRevenue} previous={previousRevenue} />
          </div>
        </Link>
      )}

      {/* 今月の来店 */}
      <Link
        href="/records"
        className={`bg-surface border border-border rounded-2xl p-4 shadow-card hover:shadow-card-hover hover:border-accent hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200${!canSeeRevenue ? " col-span-2" : ""}`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            {visitChange && (
              <span className={`text-xs font-medium ${visitChange.color}`}>
                {visitChange.text}
                <span className="text-text-light font-normal ml-0.5">先月比</span>
              </span>
            )}
          </div>
          <p className="text-lg font-bold">
            {currentVisits}
            <span className="text-sm font-normal text-text-light ml-0.5">件</span>
          </p>
          <p className="text-xs text-text-light">今月の来店</p>
          <MiniComparisonBar current={currentVisits} previous={previousVisits} />
        </div>
      </Link>
    </div>
  );
}
