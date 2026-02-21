"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CsvUploadStep } from "@/components/import/csv-upload-step";
import { CsvPreviewTable, type ColumnDef } from "@/components/import/csv-preview-table";
import { CsvImportingStep } from "@/components/import/csv-importing-step";
import { CsvResultStep } from "@/components/import/csv-result-step";
import { parseCSV, validateRows, type RowValidation } from "@/lib/csv-parse";
import { fileToCSVBuffer } from "@/lib/excel-parse";

type Step = "upload" | "preview" | "importing" | "result";

const TEMPLATE_HEADER = "氏名,フリガナ,生年月日,住所,メール,電話";
const TEMPLATE_SAMPLE = "山田 花子,ヤマダ ハナコ,1990/5/15,東京都渋谷区1-1-1,hanako@example.com,090-1234-5678";

const columns: ColumnDef[] = [
  { key: "name", label: "氏名", render: (r: RowValidation) => `${r.data.last_name} ${r.data.first_name}` },
  { key: "kana", label: "カナ", render: (r: RowValidation) => r.data.last_name_kana ? `${r.data.last_name_kana} ${r.data.first_name_kana ?? ""}` : "-" },
  { key: "birth", label: "生年月日", render: (r: RowValidation) => r.data.birth_date ?? "-" },
  { key: "phone", label: "電話", render: (r: RowValidation) => r.data.phone ?? "-" },
];

export default function ImportCustomersPage() {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");
  const [salonId, setSalonId] = useState("");
  const [existingCustomers, setExistingCustomers] = useState<
    { last_name: string; first_name: string; phone: string | null; email: string | null }[]
  >([]);

  const [rows, setRows] = useState<RowValidation[]>([]);
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
    const { data: customers } = await supabase
      .from("customers").select("last_name, first_name, phone, email").eq("salon_id", salon.id);
    setExistingCustomers(customers ?? []);
  };

  const handleFileSelected = async (file: File) => {
    setError("");
    try {
      const buffer = await fileToCSVBuffer(file);
      const { headers, rows: csvRows, encoding: enc } = parseCSV(buffer);
      setEncoding(enc);

      if (headers.length === 0 || csvRows.length === 0) {
        setError("データがありません（ヘッダーのみ、または空ファイル）");
        return;
      }

      const validated = validateRows(headers, csvRows, existingCustomers);

      // 全行がエラーの特殊チェック
      if (validated.length === 1 && validated[0].rowIndex === 0 && validated[0].status === "error") {
        setError(validated[0].messages[0]);
        return;
      }

      setRows(validated.filter((r) => r.status !== "skip"));
      setStep("preview");
    } catch {
      setError("ファイルの解析に失敗しました。CSV または Excel ファイルを選択してください。");
    }
  };

  const handleToggleRow = (idx: number) => {
    setRows((prev) => prev.map((r) =>
      r.rowIndex === idx && r.status !== "error" ? { ...r, checked: !r.checked } : r
    ));
  };

  const handleToggleAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) =>
      r.status !== "error" ? { ...r, checked } : r
    ));
  };

  const handleImport = async () => {
    const checkedRows = rows.filter((r) => r.checked && r.status !== "error");
    if (checkedRows.length === 0) return;

    setStep("importing");
    setImportTotal(checkedRows.length);
    setImportProgress(0);

    const supabase = createClient();
    const BATCH = 50;
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < checkedRows.length; i += BATCH) {
      const batch = checkedRows.slice(i, i + BATCH);
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
        .from("customers").insert(insertData).select("id");

      if (insertError) {
        failed += batch.length;
        errors.push(`行${batch[0].rowIndex + 1}〜${batch[batch.length - 1].rowIndex + 1}: ${insertError.message}`);
      } else {
        success += data?.length ?? 0;
      }
      setImportProgress(Math.min(i + BATCH, checkedRows.length));
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

      {step === "upload" && (
        <CsvUploadStep
          title="顧客データ取り込み"
          templateDescription="テンプレートをダウンロードし、顧客データを入力してください。Excelファイルもそのままアップロードできます。氏名は姓と名をスペースで区切って入力してください。"
          templateFilename="顧客インポートテンプレート.csv"
          templateHeader={TEMPLATE_HEADER}
          templateSample={TEMPLATE_SAMPLE}
          onFileSelected={handleFileSelected}
          error={error}
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
          primaryAction={{ label: "顧客一覧を見る", href: "/customers" }}
          secondaryAction={{ label: "続けて取り込む", onClick: handleReset }}
          hubAction={{ label: "データ取り込みに戻る", href: "/settings/import" }}
        />
      )}
    </div>
  );
}
