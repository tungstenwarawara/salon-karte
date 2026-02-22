"use client";

import { useState } from "react";
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

const INITIAL_SHOW = 5;

export function TreatmentHistory({ customerId, records }: Props) {
  const [showAll, setShowAll] = useState(false);

  const displayRecords = showAll ? records : records.slice(0, INITIAL_SHOW);
  const hasMore = records.length > INITIAL_SHOW;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">施術履歴</h3>
        <Link
          href={`/records/new?customer=${customerId}`}
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center"
        >
          + カルテを登録
        </Link>
      </div>

      {records.length > 0 ? (
        <div className="space-y-2">
          {displayRecords.map((record) => {
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
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-center text-sm text-accent py-2 min-h-[44px]"
            >
              {showAll ? "閉じる" : `もっと見る（残り${records.length - INITIAL_SHOW}件）`}
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
