"use client";

import { useRef } from "react";
import { isSupportedFile } from "@/lib/excel-parse";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB（Excel は CSV より大きい）

export function CsvUploadStep({
  title,
  templateDescription,
  templateFilename,
  templateHeader,
  templateSample,
  onFileSelected,
  error,
  notes,
}: {
  title: string;
  templateDescription: string;
  templateFilename: string;
  templateHeader: string;
  templateSample: string;
  onFileSelected: (file: File) => void;
  error?: string;
  notes?: React.ReactNode;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const bom = "\uFEFF";
    const csv = bom + templateHeader + "\n" + templateSample + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedFile(file)) {
      alert("CSV (.csv) または Excel (.xlsx / .xls) ファイルを選択してください。");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("ファイルサイズが5MBを超えています");
      return;
    }
    onFileSelected(file);
    // inputをリセットして同じファイルを再選択可能に
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* テンプレートダウンロード */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm">1. テンプレートをダウンロード</h3>
        <p className="text-xs text-text-light">{templateDescription}</p>
        <button
          onClick={downloadTemplate}
          className="bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-accent/90 transition-colors"
        >
          テンプレートをダウンロード
        </button>
      </div>

      {/* ファイル選択 */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm">2. ファイルを選択</h3>
        <p className="text-xs text-text-light">
          テンプレートにデータを入力してアップロードしてください。CSV・Excelどちらも対応しています。
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-accent transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-text-light mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium">タップしてファイルを選択</p>
          <p className="text-xs text-text-light mt-1">CSV・Excel対応（最大5MB）</p>
        </button>
        {/* iPadのSafariはCSVを text/plain と認識するため accept を広めに設定 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.xls,.xlsx,text/*,application/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {notes && (
        <div className="text-xs text-text-light bg-background rounded-xl p-3">
          {notes}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
