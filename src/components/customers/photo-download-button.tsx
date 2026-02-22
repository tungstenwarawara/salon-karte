"use client";

import { useState } from "react";
import { downloadCustomerPhotosAsZip } from "@/lib/photo-download";
import { Toast } from "@/components/ui/toast";

type Props = {
  customerId: string;
  salonId: string;
  customerName: string;
  hasPhotos: boolean;
};

export function PhotoDownloadButton({ customerId, salonId, customerName, hasPhotos }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  if (!hasPhotos) return null;

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    const result = await downloadCustomerPhotosAsZip(
      customerId,
      salonId,
      customerName,
      (current, total) => setProgress({ current, total }),
    );

    setDownloading(false);

    if (result.error) {
      setError(result.error);
      console.error("写真一括ダウンロードエラー:", result.error);
    } else {
      setShowToast(true);
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="text-sm text-accent hover:underline min-h-[44px] flex items-center disabled:opacity-50"
      >
        {downloading
          ? `ダウンロード中... (${progress.current}/${progress.total})`
          : "写真一括DL"}
      </button>
      {error && (
        <div className="absolute top-full right-0 mt-1 bg-error/10 text-error text-xs rounded-lg p-2 whitespace-nowrap z-10">
          {error}
        </div>
      )}
      {showToast && (
        <Toast message="写真のダウンロードが完了しました" onClose={() => setShowToast(false)} />
      )}
    </>
  );
}
