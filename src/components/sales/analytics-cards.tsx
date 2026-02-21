import { formatYen } from "@/components/sales/sales-types";

type Props = {
  avgRevenuePerVisit: number;
  repeatRate: number;
  avgVisits: number;
  avgLtv: number;
};

export function AnalyticsCards({ avgRevenuePerVisit, repeatRate, avgVisits, avgLtv }: Props) {
  const cards = [
    { label: "客単価", value: formatYen(avgRevenuePerVisit), sub: "1回あたり" },
    { label: "リピート率", value: `${repeatRate}%`, sub: "2回以上来店" },
    { label: "平均来店回数", value: `${avgVisits}回`, sub: "顧客あたり" },
    { label: "平均LTV", value: formatYen(avgLtv), sub: "顧客あたり総売上" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-surface border border-border rounded-2xl p-4 text-center">
          <p className="text-xs text-text-light">{c.label}</p>
          <p className="text-xl font-bold mt-1">{c.value}</p>
          <p className="text-[10px] text-text-light mt-0.5">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
