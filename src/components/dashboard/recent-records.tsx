import Link from "next/link";
import { formatDateRelative } from "@/lib/format";
import type { Database } from "@/types/database";

type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type RecordWithCustomer = TreatmentRecord & {
  customers: { last_name: string; first_name: string } | null;
};

export function RecentRecords({
  records,
}: {
  records: RecordWithCustomer[] | null;
}) {
  if (!records || records.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">最近のカルテ</h3>
        <Link href="/customers" className="text-xs text-accent hover:underline">
          顧客一覧 →
        </Link>
      </div>
      <div className="space-y-2">
        {records.map((record) => {
          const customer = record.customers;
          return (
            <Link
              key={record.id}
              href={`/records/${record.id}`}
              className="block bg-surface border border-border rounded-xl p-3 hover:border-accent transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">
                  {customer
                    ? `${customer.last_name} ${customer.first_name}`
                    : "不明"}
                </span>
                <span className="text-xs text-text-light">
                  {formatDateRelative(record.treatment_date)}
                </span>
              </div>
              {record.menu_name_snapshot && (
                <p className="text-xs text-text-light mt-1">
                  {record.menu_name_snapshot}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
