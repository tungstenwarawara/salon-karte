"use client";

import { useState } from "react";
import { Toast, useToast } from "@/components/ui/toast";
import { triggerCsvDownload } from "@/lib/csv-export";
import {
  exportCustomers,
  exportRecords,
  exportPurchases,
  exportAppointments,
  exportCourseTickets,
} from "@/app/(dashboard)/settings/export/actions";

type Counts = {
  customers: number;
  records: number;
  purchases: number;
  appointments: number;
  courseTickets: number;
};

const EXPORT_ITEMS = [
  { key: "customers", label: "顧客一覧", action: exportCustomers, filePrefix: "顧客一覧" },
  { key: "records", label: "施術履歴", action: exportRecords, filePrefix: "施術履歴" },
  { key: "purchases", label: "物販記録", action: exportPurchases, filePrefix: "物販記録" },
  { key: "appointments", label: "予約一覧", action: exportAppointments, filePrefix: "予約一覧" },
  { key: "courseTickets", label: "回数券", action: exportCourseTickets, filePrefix: "回数券一覧" },
] as const;

export function ExportPanel({ counts }: { counts: Counts }) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const today = new Date().toISOString().slice(0, 10);

  const handleExport = async (item: (typeof EXPORT_ITEMS)[number]) => {
    setLoadingKey(item.key);
    try {
      const csv = await item.action();
      triggerCsvDownload(`${item.filePrefix}_${today}.csv`, csv);
      showToast(`${item.label}をダウンロードしました`);
    } catch {
      showToast("エクスポートに失敗しました", "error");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="space-y-3">
        {EXPORT_ITEMS.map((item) => {
          const count = counts[item.key];
          const isLoading = loadingKey === item.key;
          return (
            <div
              key={item.key}
              className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-text-light mt-0.5">{count}件</p>
              </div>
              <button
                onClick={() => handleExport(item)}
                disabled={isLoading || count === 0}
                className="text-sm bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50 min-h-[44px] font-medium"
              >
                {isLoading ? "ダウンロード中..." : "ダウンロード"}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
