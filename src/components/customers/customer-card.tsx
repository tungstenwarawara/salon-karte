import Link from "next/link";

type Props = {
  id: string;
  last_name: string;
  first_name: string;
  last_name_kana: string | null;
  first_name_kana: string | null;
  graduated_at: string | null;
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

export function CustomerCard(customer: Props) {
  const days = daysSince(customer.last_visit_date);
  const visitLabel = getVisitLabel(days);

  return (
    <Link
      href={`/customers/${customer.id}`}
      className="block bg-surface border border-border rounded-xl p-4 hover:border-accent hover:shadow-sm active:scale-[0.98] transition-all duration-200"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">
            {customer.last_name} {customer.first_name}
            {customer.graduated_at && (
              <span className="ml-2 text-xs text-orange-500 font-normal">卒業</span>
            )}
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
}
