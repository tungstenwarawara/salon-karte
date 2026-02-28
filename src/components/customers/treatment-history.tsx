"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatDateShort } from "@/lib/format";
import { useIncrementalList } from "@/hooks/use-incremental-list";
import { PhotoDownloadButton } from "@/components/customers/photo-download-button";
import type { Database } from "@/types/database";

type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type TreatmentRecordMenu = Database["public"]["Tables"]["treatment_record_menus"]["Row"];

type RecordWithMenus = TreatmentRecord & {
  treatment_record_menus: TreatmentRecordMenu[];
};

type Props = {
  customerId: string;
  salonId: string;
  customerName: string;
  records: RecordWithMenus[];
  hasPhotos: boolean;
};

export function TreatmentHistory({ customerId, salonId, customerName, records, hasPhotos }: Props) {
  const { displayItems, hasMore, remaining, showMore, collapse, isExpanded } =
    useIncrementalList(records, 10, 5);

  // 月別グループ化（表示中の記録のみ）
  const grouped = useMemo(() => {
    const groups: { label: string; records: RecordWithMenus[] }[] = [];
    let currentKey = "";

    for (const record of displayItems) {
      const [y, m] = record.treatment_date.split("-");
      const key = `${y}-${m}`;
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ label: `${parseInt(y)}年${parseInt(m)}月`, records: [] });
      }
      groups[groups.length - 1].records.push(record);
    }
    return groups;
  }, [displayItems]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">施術履歴</h3>
        <div className="flex items-center gap-3">
          <PhotoDownloadButton
            customerId={customerId}
            salonId={salonId}
            customerName={customerName}
            hasPhotos={hasPhotos}
          />
          <Link
            href={`/records/new?customer=${customerId}`}
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center"
          >
            + カルテを登録
          </Link>
        </div>
      </div>

      {records.length > 0 ? (
        <div>
          {grouped.map((group, gi) => (
            <div key={group.label}>
              <p className={`text-xs text-text-light font-medium mb-1 ${gi > 0 ? "mt-3" : ""}`}>
                {group.label}
              </p>
              <div className="space-y-2">
                {group.records.map((record) => {
                  const recordMenus = record.treatment_record_menus ?? [];
                  const menuDisplay = recordMenus.length > 0
                    ? recordMenus.map((rm) => rm.menu_name_snapshot).join("、")
                    : record.menu_name_snapshot ?? "施術記録";
                  return (
                    <Link
                      key={record.id}
                      href={`/records/${record.id}`}
                      className="block bg-surface border border-border rounded-xl p-3 hover:border-accent hover:shadow-sm active:scale-[0.98] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-text-light shrink-0">{formatDateShort(record.treatment_date)}</span>
                        <span className="font-medium text-sm truncate">{menuDisplay}</span>
                      </div>
                      {record.next_visit_memo && (
                        <p className="text-sm text-text-light mt-1 truncate">次回: {record.next_visit_memo}</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={showMore}
              className="w-full text-center text-sm text-accent py-2 min-h-[44px] mt-2"
            >
              もっと見る（残り{remaining}件）
            </button>
          )}
          {isExpanded && (
            <button
              onClick={collapse}
              className="w-full text-center text-sm text-text-light py-2 min-h-[44px]"
            >
              閉じる
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-light text-sm">施術記録はまだありません</p>
          <Link
            href={`/records/new?customer=${customerId}`}
            className="inline-block mt-2 text-sm text-accent hover:underline font-medium"
          >
            最初のカルテを登録する →
          </Link>
        </div>
      )}
    </div>
  );
}
