"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientAuth } from "@/lib/supabase/client-auth";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CsvUploadStep } from "@/components/import/csv-upload-step";
import { CsvPreviewTable, type ColumnDef } from "@/components/import/csv-preview-table";
import { CsvImportingStep } from "@/components/import/csv-importing-step";
import { CsvResultStep } from "@/components/import/csv-result-step";
import { parseCSV } from "@/lib/csv-parse";
import { fileToCSVBuffer } from "@/lib/excel-parse";
import { validateProductRows, type ProductRowValidation } from "@/lib/csv-import-products";

type Step = "upload" | "preview" | "importing" | "result";

const TEMPLATE_HEADER = "商品名,カテゴリ,販売価格,仕入価格,発注点,メモ";
const TEMPLATE_SAMPLE = "シャンプーA,ヘアケア,2500,1200,3,人気商品";

const columns: ColumnDef[] = [
  { key: "name", label: "商品名", render: (r: ProductRowValidation) => r.data.name },
  { key: "category", label: "カテゴリ", render: (r: ProductRowValidation) => r.data.category ?? "-" },
  { key: "sell", label: "売価", render: (r: ProductRowValidation) => r.data.base_sell_price ? `¥${r.data.base_sell_price.toLocaleString()}` : "-" },
  { key: "cost", label: "仕入", render: (r: ProductRowValidation) => r.data.base_cost_price ? `¥${r.data.base_cost_price.toLocaleString()}` : "-" },
];

export default function ImportProductsPage() {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");
  const [salonId, setSalonId] = useState("");
  const [existingProducts, setExistingProducts] = useState<{ name: string }[]>([]);

  const [rows, setRows] = useState<ProductRowValidation[]>([]);
  const [encoding, setEncoding] = useState("");
  const [excelWarnings, setExcelWarnings] = useState<string[]>([]);

  const [resultSuccess, setResultSuccess] = useState(0);
  const [resultFailed, setResultFailed] = useState(0);
  const [resultErrors, setResultErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  useEffect(() => { loadSalonData(); }, []);

  const loadSalonData = async () => {
    const { user, salonId: sid } = await getClientAuth();
    if (!user || !sid) return;
    setSalonId(sid);

    const supabase = createClient();
    const { data: products } = await supabase
      .from("products").select("name").eq("salon_id", sid);
    setExistingProducts(products ?? []);
  };

  const handleFileSelected = async (file: File) => {
    setError("");
    setExcelWarnings([]);
    try {
      const { buffer, warnings } = await fileToCSVBuffer(file);
      setExcelWarnings(warnings);
      const { headers, rows: csvRows, encoding: enc } = parseCSV(buffer);
      setEncoding(enc);
      if (csvRows.length === 0) {
        setError("データ行がありません");
        return;
      }
      const validated = validateProductRows(headers, csvRows, existingProducts);
      setRows(validated);
      setStep("preview");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "不明なエラー";
      setError(`ファイルの解析に失敗しました: ${msg}`);
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
    const entityIds: string[] = [];
    const BATCH = 50;

    for (let i = 0; i < toImport.length; i += BATCH) {
      const batch = toImport.slice(i, i + BATCH);
      const insertData = batch.map((r) => ({
        salon_id: salonId,
        name: r.data.name,
        category: r.data.category,
        base_sell_price: r.data.base_sell_price,
        base_cost_price: r.data.base_cost_price,
        reorder_point: r.data.reorder_point,
        memo: r.data.memo,
        is_active: true,
      }));

      const { data, error } = await supabase
        .from("products").insert(insertData).select("id");

      if (error) {
        failed += batch.length;
        errors.push(`行${i + 1}〜${i + batch.length}: ${error.message}`);
      } else {
        success += data?.length ?? 0;
        failed += batch.length - (data?.length ?? 0);
        if (data) entityIds.push(...data.map((d) => d.id));
      }
      setImportProgress(Math.min(i + BATCH, toImport.length));
    }

    // 取り込み履歴を記録
    if (entityIds.length > 0) {
      await supabase.from("import_batches").insert({
        salon_id: salonId,
        batch_type: "products",
        total_count: toImport.length,
        success_count: success,
        failed_count: failed,
        entity_ids: entityIds,
      });
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
    setExcelWarnings([]);
    setResultSuccess(0);
    setResultFailed(0);
    setResultErrors([]);
    loadSalonData();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="商品データ取り込み"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "データ取り込み", href: "/settings/import" },
          { label: "商品データ取り込み" },
        ]}
      />

      {error && <ErrorAlert message={error} />}

      {step === "upload" && (
        <CsvUploadStep
          title="商品データ取り込み"
          templateDescription="テンプレートをダウンロードし、商品データを入力してください。Excelファイルもそのままアップロードできます。「商品名」のみ必須です。"
          templateFilename="商品インポートテンプレート.csv"
          templateHeader={TEMPLATE_HEADER}
          templateSample={TEMPLATE_SAMPLE}
          onFileSelected={handleFileSelected}
          error={error}
        />
      )}

      {step === "preview" && excelWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          {excelWarnings.map((w, i) => (
            <p key={i} className="text-sm text-yellow-700">{w}</p>
          ))}
        </div>
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
          primaryAction={{ label: "商品一覧を見る", href: "/sales/inventory/products" }}
          secondaryAction={{ label: "続けて取り込む", onClick: handleReset }}
          hubAction={{ label: "データ取り込みに戻る", href: "/settings/import" }}
        />
      )}
    </div>
  );
}
