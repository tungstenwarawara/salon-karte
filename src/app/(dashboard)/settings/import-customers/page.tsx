"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import { parseCSV, validateRows, type RowValidation } from "@/lib/csv-parse";

type Step = "upload" | "preview" | "importing" | "result";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export default function ImportCustomersPage() {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");
  const [salonId, setSalonId] = useState("");
  const [existingCustomers, setExistingCustomers] = useState<
    { last_name: string; first_name: string; phone: string | null; email: string | null }[]
  >([]);

  // プレビュー
  const [rows, setRows] = useState<RowValidation[]>([]);
  const [encoding, setEncoding] = useState("");

  // 結果
  const [resultSuccess, setResultSuccess] = useState(0);
  const [resultFailed, setResultFailed] = useState(0);
  const [resultErrors, setResultErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSalonData();
  }, []);

  const loadSalonData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single<{ id: string }>();
    if (!salon) return;

    setSalonId(salon.id);

    const { data: customers } = await supabase
      .from("customers")
      .select("last_name, first_name, phone, email")
      .eq("salon_id", salon.id);

    setExistingCustomers(customers ?? []);
  };

  // テンプレートダウンロード
  const downloadTemplate = () => {
    const bom = "\uFEFF";
    const header = "氏名,フリガナ,生年月日,住所,メール,電話";
    const sample = "山田 花子,ヤマダ ハナコ,1990/5/15,東京都渋谷区1-1-1,hanako@example.com,090-1234-5678";
    const csv = `${header}\n${sample}`;

    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "顧客インポートテンプレート.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ファイル処理
  const handleFile = async (file: File) => {
    setError("");

    if (!file.name.endsWith(".csv")) {
      setError("CSVファイルを選択してください（.csv）");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("ファイルサイズが1MBを超えています");
      return;
    }

    const buffer = await file.arrayBuffer();
    const { headers, rows: csvRows, encoding: enc } = parseCSV(buffer);
    setEncoding(enc);

    if (headers.length === 0 || csvRows.length === 0) {
      setError("CSVにデータがありません（ヘッダーのみ、または空ファイル）");
      return;
    }

    const validated = validateRows(headers, csvRows, existingCustomers);

    // 全行がスキップ or エラーの特殊チェック
    if (validated.length === 1 && validated[0].rowIndex === 0 && validated[0].status === "error") {
      setError(validated[0].messages[0]);
      return;
    }

    setRows(validated.filter((r) => r.status !== "skip"));
    setStep("preview");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // リセットして同じファイルを再選択可能に
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // チェックボックス制御
  const toggleRow = (rowIndex: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.rowIndex === rowIndex && r.status !== "error"
          ? { ...r, checked: !r.checked }
          : r,
      ),
    );
  };

  const toggleAll = (checked: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.status !== "error" ? { ...r, checked } : r)),
    );
  };

  // インポート実行
  const handleImport = async () => {
    const checkedRows = rows.filter((r) => r.checked && r.status !== "error");
    if (checkedRows.length === 0) return;

    setStep("importing");
    setImportTotal(checkedRows.length);
    setImportProgress(0);

    const supabase = createClient();
    const BATCH_SIZE = 50;
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < checkedRows.length; i += BATCH_SIZE) {
      const batch = checkedRows.slice(i, i + BATCH_SIZE);
      const insertData = batch.map((r) => ({
        salon_id: salonId,
        last_name: r.data.last_name,
        first_name: r.data.first_name,
        last_name_kana: r.data.last_name_kana,
        first_name_kana: r.data.first_name_kana,
        birth_date: r.data.birth_date,
        phone: r.data.phone,
        email: r.data.email,
        address: r.data.address,
      }));

      const { data, error: insertError } = await supabase
        .from("customers")
        .insert(insertData)
        .select("id");

      if (insertError) {
        failed += batch.length;
        errors.push(`行 ${batch[0].rowIndex}〜${batch[batch.length - 1].rowIndex}: ${insertError.message}`);
      } else {
        success += data?.length ?? 0;
      }

      setImportProgress(Math.min(i + BATCH_SIZE, checkedRows.length));
    }

    setResultSuccess(success);
    setResultFailed(failed);
    setResultErrors(errors);
    setStep("result");
  };

  // 集計
  const checkedCount = rows.filter((r) => r.checked).length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="顧客データ取り込み"
        backLabel="データ取り込み"
        backHref="/settings/import"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "データ取り込み", href: "/settings/import" },
          { label: "顧客データ取り込み" },
        ]}
      />

      {error && <ErrorAlert message={error} />}

      {/* Step 1: アップロード */}
      {step === "upload" && (
        <div className="space-y-4">
          {/* テンプレート */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm">1. テンプレートを準備</h3>
            <p className="text-sm text-text-light">
              テンプレートCSVをダウンロードして、Excelの顧客データを貼り付けてください。
              氏名は<span className="font-medium text-text">姓と名をスペースで区切って</span>入力してください。
            </p>
            <button
              onClick={downloadTemplate}
              className="bg-accent/10 text-accent text-sm font-medium rounded-xl px-4 py-2.5 hover:bg-accent/20 transition-colors min-h-[44px]"
            >
              テンプレートをダウンロード
            </button>
          </div>

          {/* アップロード */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm">2. CSVファイルをアップロード</h3>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-text-light mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-text-light">
                CSVファイルをタップして選択
              </p>
              <p className="text-xs text-text-light mt-1">
                UTF-8・Shift-JIS対応 / 最大1MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Step 2: プレビュー */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* サマリーバナー */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span>全 <span className="font-bold">{rows.length}</span> 件</span>
              <span className="text-accent">
                ✓ <span className="font-bold">{checkedCount}</span> 件選択中
              </span>
              {duplicateCount > 0 && (
                <span className="text-orange-500">
                  ⚠ <span className="font-bold">{duplicateCount}</span> 件重複
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-error">
                  ✗ <span className="font-bold">{errorCount}</span> 件エラー
                </span>
              )}
            </div>
            <p className="text-xs text-text-light mt-1">
              検出エンコーディング: {encoding}
            </p>
          </div>

          {/* 一括操作 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="text-xs text-accent px-3 py-1.5 rounded-lg hover:bg-accent/10 transition-colors min-h-[36px]"
            >
              すべて選択
            </button>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="text-xs text-text-light px-3 py-1.5 rounded-lg hover:bg-background transition-colors min-h-[36px]"
            >
              すべて解除
            </button>
          </div>

          {/* テーブル */}
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="min-w-[600px]">
              {/* ヘッダー */}
              <div className="grid grid-cols-[32px_32px_1fr_1fr_80px_100px_auto] gap-2 text-xs text-text-light font-medium px-3 py-2 border-b border-border">
                <span />
                <span>行</span>
                <span>氏名</span>
                <span>フリガナ</span>
                <span>生年月日</span>
                <span>電話</span>
                <span>ステータス</span>
              </div>

              {/* 行 */}
              <div className="divide-y divide-border/50">
                {rows.map((row) => (
                  <div
                    key={row.rowIndex}
                    className={`grid grid-cols-[32px_32px_1fr_1fr_80px_100px_auto] gap-2 items-start px-3 py-2.5 text-sm ${
                      row.status === "error"
                        ? "bg-error/5"
                        : row.isDuplicate
                          ? "bg-orange-50"
                          : row.status === "warning"
                            ? "bg-yellow-50"
                            : ""
                    }`}
                  >
                    <span>
                      {row.status !== "error" && (
                        <input
                          type="checkbox"
                          checked={row.checked}
                          onChange={() => toggleRow(row.rowIndex)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
                        />
                      )}
                    </span>
                    <span className="text-xs text-text-light">{row.rowIndex}</span>
                    <span className="truncate">
                      {row.data.last_name} {row.data.first_name}
                    </span>
                    <span className="truncate text-text-light">
                      {row.data.last_name_kana} {row.data.first_name_kana}
                    </span>
                    <span className="text-xs text-text-light">
                      {row.data.birth_date ?? ""}
                    </span>
                    <span className="text-xs text-text-light truncate">
                      {row.data.phone ?? ""}
                    </span>
                    <span>
                      {row.status === "ok" && (
                        <span className="text-xs text-accent">OK</span>
                      )}
                      {row.status === "error" && (
                        <span className="text-xs text-error">エラー</span>
                      )}
                      {row.status === "warning" && !row.isDuplicate && (
                        <span className="text-xs text-yellow-600">注意</span>
                      )}
                      {row.isDuplicate && (
                        <span className="text-xs text-orange-500">重複</span>
                      )}
                    </span>
                    {/* メッセージ行 */}
                    {row.messages.length > 0 && (
                      <div className="col-span-7 pl-16">
                        {row.messages.map((msg, mi) => (
                          <p key={mi} className={`text-xs ${row.status === "error" ? "text-error" : "text-text-light"}`}>
                            {msg}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep("upload");
                setRows([]);
                setError("");
              }}
              className="flex-1 bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]"
            >
              やり直す
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={checkedCount === 0}
              className="flex-1 bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              {checkedCount}件を取り込む
            </button>
          </div>
        </div>
      )}

      {/* Step 3: インポート中 */}
      {step === "importing" && (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">
            取り込み中... {importProgress} / {importTotal} 件
          </p>
          <div className="w-full bg-background rounded-full h-2">
            <div
              className="bg-accent rounded-full h-2 transition-all"
              style={{ width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 4: 結果 */}
      {step === "result" && (
        <div className="space-y-4">
          {resultSuccess > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-500 mx-auto mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <p className="text-lg font-bold text-green-700">
                {resultSuccess}件の顧客を登録しました
              </p>
            </div>
          )}

          {resultFailed > 0 && (
            <div className="bg-error/5 border border-error/20 rounded-2xl p-5 space-y-2">
              <p className="text-sm font-bold text-error">
                {resultFailed}件の登録に失敗しました
              </p>
              {resultErrors.map((err, i) => (
                <p key={i} className="text-xs text-error">{err}</p>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Link
              href="/customers"
              className="block w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors min-h-[48px] text-center"
            >
              顧客一覧を見る
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep("upload");
                setRows([]);
                setError("");
                setResultSuccess(0);
                setResultFailed(0);
                setResultErrors([]);
                // 既存顧客リストを更新
                loadSalonData();
              }}
              className="block w-full bg-background border border-border text-text font-medium rounded-xl py-3 transition-colors min-h-[48px]"
            >
              続けて取り込む
            </button>
            <Link
              href="/settings/import"
              className="block w-full text-sm text-accent text-center py-2 hover:underline"
            >
              データ取り込みに戻る
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
