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
  exportTreatmentMenus,
  exportProducts,
} from "@/app/(dashboard)/settings/export/actions";
import { downloadAllPhotosAsZip, type AllPhotosProgress } from "@/lib/photo-download-all";

type Counts = {
  customers: number;
  records: number;
  purchases: number;
  appointments: number;
  courseTickets: number;
  treatmentMenus: number;
  products: number;
  photos: number;
};

const EXPORT_ITEMS = [
  { key: "customers", label: "顧客一覧", action: exportCustomers, filePrefix: "顧客一覧" },
  { key: "records", label: "施術履歴", action: exportRecords, filePrefix: "施術履歴" },
  { key: "purchases", label: "物販記録", action: exportPurchases, filePrefix: "物販記録" },
  { key: "appointments", label: "予約一覧", action: exportAppointments, filePrefix: "予約一覧" },
  { key: "courseTickets", label: "回数券", action: exportCourseTickets, filePrefix: "回数券一覧" },
  { key: "treatmentMenus", label: "施術メニュー", action: exportTreatmentMenus, filePrefix: "施術メニュー" },
  { key: "products", label: "商品マスタ", action: exportProducts, filePrefix: "商品マスタ" },
] as const;

const BULK_THRESHOLD = 200;

export function ExportPanel({ counts, salonId }: { counts: Counts; salonId: string }) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  // 写真DL用の状態
  const [photoDownloading, setPhotoDownloading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<AllPhotosProgress | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

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

  const handlePhotoDownload = async () => {
    setPhotoDownloading(true);
    setPhotoError(null);
    setPhotoProgress(null);
    try {
      const result = await downloadAllPhotosAsZip(salonId, setPhotoProgress);
      if (result.error) {
        setPhotoError(result.error);
      } else {
        showToast("施術写真をダウンロードしました");
      }
    } catch {
      setPhotoError("写真のダウンロードに失敗しました");
    } finally {
      setPhotoDownloading(false);
      setPhotoProgress(null);
    }
  };

  const photoButtonLabel = () => {
    if (!photoProgress) return "ダウンロード中...";
    switch (photoProgress.phase) {
      case "preparing":
        return "準備中...";
      case "downloading":
        return `ダウンロード中... (${photoProgress.current}/${photoProgress.total}枚)`;
      case "customer":
        return `ダウンロード中... (${photoProgress.customerName} ${photoProgress.currentCustomer}/${photoProgress.totalCustomers}人目)`;
      case "zipping":
        return "ZIP作成中...";
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

      {/* 写真データセクション */}
      <div className="mt-6">
        <h3 className="font-bold text-sm text-text-light mb-3">写真データ</h3>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">施術写真</p>
              <p className="text-xs text-text-light mt-0.5">{counts.photos}枚</p>
            </div>
            <button
              onClick={handlePhotoDownload}
              disabled={photoDownloading || counts.photos === 0}
              className="text-sm bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50 min-h-[44px] font-medium"
            >
              {photoDownloading ? photoButtonLabel() : "ダウンロード"}
            </button>
          </div>
          {counts.photos > BULK_THRESHOLD && !photoDownloading && (
            <p className="text-xs text-text-light mt-2">
              写真が多いため、顧客ごとに分けてダウンロードします
            </p>
          )}
          {photoError && (
            <p className="text-xs text-error mt-2">{photoError}</p>
          )}
        </div>
      </div>
    </>
  );
}
