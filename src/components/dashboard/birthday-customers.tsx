import Link from "next/link";

type BirthdayCustomer = {
  id: string;
  last_name: string;
  first_name: string;
  birth_date: string | null;
  birth_day: number;
};

export function BirthdayCustomers({
  customers,
  currentMonth,
}: {
  customers: BirthdayCustomer[];
  currentMonth: number;
}) {
  if (customers.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-pink-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
        <h3 className="font-bold text-sm">今月のお誕生日</h3>
        <span className="text-xs text-text-light">{currentMonth}月</span>
      </div>
      <div className="space-y-1">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-background transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {c.last_name} {c.first_name}
              </span>
              {c.birth_date && (() => {
                const birth = new Date(c.birth_date!);
                const today = new Date();
                let age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                return <span className="text-xs text-text-light">（{age}歳）</span>;
              })()}
            </div>
            <span className="text-xs text-text-light tabular-nums">
              {currentMonth}/{c.birth_day}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
