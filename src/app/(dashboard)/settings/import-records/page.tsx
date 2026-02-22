"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CsvUploadStep } from "@/components/import/csv-upload-step";
import { CsvPreviewTable, type ColumnDef } from "@/components/import/csv-preview-table";
import { CsvImportingStep } from "@/components/import/csv-importing-step";
import { CsvResultStep } from "@/components/import/csv-result-step";
import { parseCSV } from "@/lib/csv-parse";
import { fileToCSVBuffer } from "@/lib/excel-parse";
import {
  validateRecordRows,
  type RecordRowValidation,
  type ExistingCustomer,
  type ExistingProduct,
} from "@/lib/csv-import-records";

type Step = "upload" | "preview" | "importing" | "result";

const TEMPLATE_HEADER = "日付,お客様名,施術メニュー,施術料金,物販商品,物販金額,物販数量,メモ";
const TEMPLATE_SAMPLE = "2024/3/15,山田 花子,カット,5000,,,初回来店";

const columns: ColumnDef[] = [
  { key: "date", label: "日付", render: (r: RecordRowValidation) => r.data.treatment_date },
  { key: "customer", label: "顧客", render: (r: RecordRowValidation) => r.data.customer_match ?? r.data.customer_name },
  { key: "menu", label: "メニュー", render: (r: RecordRowValidation) => r.data.menu_name || "-" },
  { key: "price", label: "料金", render: (r: RecordRowValidation) => r.data.menu_price ? `¥${r.data.menu_price.toLocaleString()}` : "-" },
  { key: "product", label: "物販", render: (r: RecordRowValidation) => r.data.purchase_item ?? "-" },
];

export default function ImportRecordsPage() {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");
  const [salonId, setSalonId] = useState("");
  const [customers, setCustomers] = useState<ExistingCustomer[]>([]);
  const [products, setProducts] = useState<ExistingProduct[]>([]);

  const [rows, setRows] = useState<RecordRowValidation[]>([]);
  const [encoding, setEncoding] = useState("");

  const [resultSuccess, setResultSuccess] = useState(0);
  const [resultFailed, setResultFailed] = useState(0);
  const [resultErrors, setResultErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  useEffect(() => { loadSalonData(); }, []);

  const loadSalonData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: salon } = await supabase
      .from("salons").select("id").eq("owner_id", user.id).single();
    if (!salon) return;
    setSalonId(salon.id);

    const [custRes, prodRes] = await Promise.all([
      supabase.from("customers")
        .select("id, last_name, first_name, last_name_kana, first_name_kana")
        .eq("salon_id", salon.id),
      supabase.from("products")
        .select("id, name, base_sell_price, base_cost_price")
        .eq("salon_id", salon.id).eq("is_active", true),
    ]);
    setCustomers(custRes.data ?? []);
    setProducts(prodRes.data ?? []);
  };

  const handleFileSelected = async (file: File) => {
    setError("");
    try {
      const buffer = await fileToCSVBuffer(file);
      const { headers, rows: csvRows, encoding: enc } = parseCSV(buffer);
      setEncoding(enc);
      if (csvRows.length === 0) {
        setError("データ行がありません");
        return;
      }
      const validated = validateRecordRows(headers, csvRows, customers, products);
      setRows(validated);
      setStep("preview");
    } catch {
      setError("ファイルの解析に失敗しました。CSV または Excel ファイルを選択してください。");
    }
  };

  const handleToggleRow = (idx: number) => {
    setRows((prev) => prev.map((r) =>
      r.rowIndex === idx ? { ...r, checked: !r.checked } : r
    ));
  };

  const handleToggleAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) =>
      r.status !== "error" ? { ...r, checked } : r
    ));
  };

  const handleImport = async () => {
    const toImport = rows.filter((r) => r.checked);
    setImportTotal(toImport.length);
    setImportProgress(0);
    setStep("importing");

    const supabase = createClient();
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    const BATCH = 10;

    for (let i = 0; i < toImport.length; i += BATCH) {
      const batch = toImport.slice(i, i + BATCH);

      for (const row of batch) {
        try {
          // 1. 施術記録を作成
          const { data: record, error: recError } = await supabase
            .from("treatment_records")
            .insert({
              salon_id: salonId,
              customer_id: row.data.customer_id!,
              treatment_date: row.data.treatment_date,
              menu_name_snapshot: row.data.menu_name || null,
              notes_after: row.data.memo,
            })
            .select("id")
            .single();

          if (recError || !record) {
            failed++;
            errors.push(`行${row.rowIndex + 1}: ${recError?.message ?? "登録失敗"}`);
            continue;
          }

          // 2. メニュー情報を登録（treatment_record_menus）
          if (row.data.menu_name) {
            await supabase.from("treatment_record_menus").insert({
              treatment_record_id: record.id,
              menu_name_snapshot: row.data.menu_name,
              price_snapshot: row.data.menu_price,
              payment_type: "cash",
              sort_order: 0,
            });
          }

          // 3. 物販がある場合は purchases を作成
          if (row.data.purchase_item) {
            await supabase.from("purchases").insert({
              salon_id: salonId,
              customer_id: row.data.customer_id!,
              purchase_date: row.data.treatment_date,
              item_name: row.data.purchase_item,
              quantity: row.data.purchase_quantity,
              unit_price: row.data.purchase_price ?? 0,
              total_price: (row.data.purchase_price ?? 0) * row.data.purchase_quantity,
              product_id: row.data.purchase_product_id,
              treatment_record_id: record.id,
            });
            // ※ 歴史的データなので inventory_logs は作成しない
          }

          success++;
        } catch (e) {
          failed++;
          errors.push(`行${row.rowIndex + 1}: ${e instanceof Error ? e.message : "不明なエラー"}`);
        }
      }

      setImportProgress(Math.min(i + BATCH, toImport.length));
    }

    setResultSuccess(success);
    setResultFailed(failed);
    setResultErrors(errors);
    setStep("result");
  };

  const handleReset = () => {
    setStep("upload");
    setRows([]);
    setError("");
    setResultSuccess(0);
    setResultFailed(0);
    setResultErrors([]);
    loadSalonData();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="施術履歴取り込み"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "データ取り込み", href: "/settings/import" },
          { label: "施術履歴取り込み" },
        ]}
      />

      {error && <ErrorAlert message={error} />}

      {step === "upload" && (
        <CsvUploadStep
          title="施術履歴取り込み"
          templateDescription="テンプレートをダウンロードし、施術履歴を入力してください。Excelファイルもそのままアップロードできます。「日付」と「お客様名」が必須です。お客様名は顧客マスタに登録済みの名前と一致させてください。"
          templateFilename="施術履歴インポートテンプレート.csv"
          templateHeader={TEMPLATE_HEADER}
          templateSample={TEMPLATE_SAMPLE}
          onFileSelected={handleFileSelected}
          error={error}
          notes={
            <>
              <p>💡 1行が1つのカルテになります。複数メニューは「カット、カラー」のようにまとめて入力してください。</p>
              <p className="mt-1">💡 物販欄の商品が商品マスタに登録済みなら在庫と連携します（過去データは在庫数に影響しません）。</p>
            </>
          }
        />
      )}

      {step === "preview" && (
        <CsvPreviewTable
          rows={rows}
          columns={columns}
          encoding={encoding}
          onToggleRow={handleToggleRow}
          onToggleAll={handleToggleAll}
          onImport={handleImport}
          onReset={handleReset}
        />
      )}

      {step === "importing" && (
        <CsvImportingStep progress={importProgress} total={importTotal} />
      )}

      {step === "result" && (
        <CsvResultStep
          successCount={resultSuccess}
          failedCount={resultFailed}
          errors={resultErrors}
          primaryAction={{ label: "カルテ一覧を見る", href: "/records" }}
          secondaryAction={{ label: "続けて取り込む", onClick: handleReset }}
          hubAction={{ label: "データ取り込みに戻る", href: "/settings/import" }}
        />
      )}
    </div>
  );
}
