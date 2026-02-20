import Link from "next/link";
import { formatDateShort } from "@/lib/format";
import type { Database } from "@/types/database";

type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type TreatmentRecordMenu = Database["public"]["Tables"]["treatment_record_menus"]["Row"];

type RecordWithMenus = TreatmentRecord & {
  treatment_record_menus: TreatmentRecordMenu[];
};

type Props = {
  customerId: string;
  records: RecordWithMenus[];
};

export function TreatmentHistory({ customerId, records }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">施術履歴</h3>
        <Link
          href={`/records/new?customer=${customerId}`}
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[40px] flex items-center"
        >
          + カルテ作成
        </Link>
      </div>

      {records.length > 0 ? (
        <div className="space-y-2">
          {records.map((record) => {
            const recordMenus = record.treatment_record_menus ?? [];
            const menuDisplay = recordMenus.length > 0
              ? recordMenus.map((rm) => rm.menu_name_snapshot).join("、")
              : record.menu_name_snapshot ?? "施術記録";
            return (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="block bg-surface border border-border rounded-xl p-3 hover:border-accent transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm truncate mr-2">{menuDisplay}</span>
                  <span className="text-sm text-text-light shrink-0">{formatDateShort(record.treatment_date)}</span>
                </div>
                {record.next_visit_memo && (
                  <p className="text-sm text-text-light mt-1 truncate">次回: {record.next_visit_memo}</p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-light text-sm">施術記録はまだありません</p>
          <Link
            href={`/records/new?customer=${customerId}`}
            className="inline-block mt-2 text-sm text-accent hover:underline font-medium"
          >
            最初のカルテを作成する →
          </Link>
        </div>
      )}
    </div>
  );
}
