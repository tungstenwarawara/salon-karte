"use client";

import { useState } from "react";
import { Toast, useToast } from "@/components/ui/toast";
import { triggerCsvDownload } from "@/lib/csv-export";
import {
  exportAccountingCsv,
  type AccountingSoftware,
} from "@/app/(dashboard)/settings/export/accounting-actions";

const SOFTWARE_OPTIONS: { value: AccountingSoftware; label: string }[] = [
  { value: "freee", label: "freee" },
  { value: "moneyforward", label: "マネーフォワード" },
  { value: "yayoi", label: "弥生会計（やよいの青色申告）" },
];

const FILE_PREFIX: Record<AccountingSoftware, string> = {
  freee: "仕訳_freee",
  moneyforward: "仕訳_マネーフォワード",
  yayoi: "仕訳_弥生会計",
};

/** 今月の1日をYYYY-MM-DD形式で返す */
function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** 今日の日付をYYYY-MM-DD形式で返す */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AccountingExportSection() {
  const [software, setSoftware] = useState<AccountingSoftware>("freee");
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const csv = await exportAccountingCsv(software, startDate, endDate);
      const dateRange = `${startDate}_${endDate}`;
      triggerCsvDownload(`${FILE_PREFIX[software]}_${dateRange}.csv`, csv);
      showToast("仕訳データをダウンロードしました");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "エクスポートに失敗しました";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold">会計ソフト連携</h3>
          <p className="text-xs text-text-light mt-1">
            施術・物販・回数券の売上データを仕訳形式でエクスポートします。
            会計ソフトにCSV取込すると帳簿づけの手間を大幅に削減できます。
          </p>
        </div>

        {/* 会計ソフト選択 */}
        <div>
          <label className="block text-sm font-medium mb-1">会計ソフト</label>
          <select
            value={software}
            onChange={(e) => setSoftware(e.target.value as AccountingSoftware)}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white min-h-[44px]"
          >
            {SOFTWARE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 期間選択 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">開始日</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white min-h-[44px]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">終了日</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white min-h-[44px]"
            />
          </div>
        </div>

        {/* エクスポートボタン */}
        <button
          onClick={handleExport}
          disabled={loading || !startDate || !endDate}
          className="w-full bg-accent text-white font-medium rounded-xl px-4 py-3 text-sm hover:bg-accent-light transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {loading ? "ダウンロード中..." : "仕訳CSVをダウンロード"}
        </button>

        {/* 注意事項 */}
        <div className="bg-background rounded-xl p-3">
          <p className="text-xs text-text-light leading-relaxed">
            <span className="font-medium">ご注意:</span>{" "}
            出力される仕訳は売上データ（施術・物販・回数券）のみです。
            経費（仕入・家賃等）は会計ソフト側で入力してください。
            取込後は会計ソフト上で内容をご確認ください。
          </p>
        </div>
      </div>
    </>
  );
}
