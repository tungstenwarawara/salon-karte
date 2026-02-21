import Link from "next/link";
import { formatYen } from "@/components/sales/sales-types";

export type CustomerLtv = {
  customer_id: string;
  last_name: string;
  first_name: string;
  visit_count: number;
  total_revenue: number;
};

type Props = {
  customers: CustomerLtv[];
};

export function TopCustomersList({ customers }: Props) {
  if (customers.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-light">
        <p className="text-sm">施術記録を登録するとランキングが表示されます</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
      <h3 className="text-xs font-bold text-text-light uppercase tracking-wide">トップ顧客（売上順）</h3>
      <div className="divide-y divide-border">
        {customers.map((c, i) => (
          <Link
            key={c.customer_id}
            href={`/customers/${c.customer_id}`}
            className="flex items-center justify-between py-2.5 hover:bg-background/50 -mx-1 px-1 rounded transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-text-light w-5 text-right">{i + 1}</span>
              <div>
                <p className="text-sm font-medium">{c.last_name} {c.first_name}</p>
                <p className="text-xs text-text-light">{c.visit_count}回来店</p>
              </div>
            </div>
            <span className="text-sm font-bold">{formatYen(c.total_revenue)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
