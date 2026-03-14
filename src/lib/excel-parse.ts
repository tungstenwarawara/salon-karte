/**
 * Excel(.xlsx/.xls)ファイルをCSV形式のArrayBufferに変換するユーティリティ
 * xlsxライブラリ（SheetJS）は動的インポート（バンドルサイズ削減: -170kB）
 */

/** ファイルがExcel形式かどうかを判定 */
export function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xls");
}

/** ファイルがCSVまたはExcel形式かどうかを判定 */
export function isSupportedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
}

export type ExcelConvertResult = {
  buffer: ArrayBuffer;
  warnings: string[];
};

/**
 * ExcelファイルのArrayBufferをCSV形式のArrayBufferに変換
 * 1シート目のデータのみを使用
 * cellDates: true で日付セルを Date オブジェクトとして取得し、YYYY/MM/DD に正規化
 */
export async function excelToCSVBuffer(buffer: ArrayBuffer): Promise<ExcelConvertResult> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const warnings: string[] = [];
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Excelファイルにシートが見つかりません");
  }
  const sheet = workbook.Sheets[sheetName];

  // 複数シート警告
  if (workbook.SheetNames.length > 1) {
    warnings.push(`${workbook.SheetNames.length}シートのうち「${sheetName}」のみ取り込みます`);
  }

  // マージセル警告
  if (sheet["!merges"] && sheet["!merges"].length > 0) {
    warnings.push("結合セルが含まれています。データがずれる場合はセル結合を解除してください");
  }

  // Date セルを YYYY/MM/DD 文字列に正規化（シリアル値出力を防止）
  // SheetJS の cellDates: true はローカル時間で Date を生成するため、
  // ローカルメソッド（getFullYear 等）で抽出する
  const ref = sheet["!ref"];
  if (ref) {
    const range = XLSX.utils.decode_range(ref);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = sheet[addr];
        if (cell && cell.t === "d" && cell.v instanceof Date) {
          const dt = cell.v;
          if (isNaN(dt.getTime())) continue;
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, "0");
          const d = String(dt.getDate()).padStart(2, "0");
          cell.t = "s";
          cell.v = `${y}/${m}/${d}`;
          delete cell.w;
        }
      }
    }
  }

  // BOM付きUTF-8のCSVテキストに変換
  const csvText = "\uFEFF" + XLSX.utils.sheet_to_csv(sheet);
  const encoder = new TextEncoder();
  return {
    buffer: encoder.encode(csvText).buffer as ArrayBuffer,
    warnings,
  };
}

/**
 * ファイルをCSV形式のArrayBufferに変換（CSV/Excel両対応）
 * - CSVファイル → そのままArrayBufferを返す（警告なし）
 * - Excelファイル → CSV形式に変換して返す（警告あり）
 */
export async function fileToCSVBuffer(file: File): Promise<ExcelConvertResult> {
  const buffer = await file.arrayBuffer();
  if (isExcelFile(file)) {
    return excelToCSVBuffer(buffer);
  }
  return { buffer, warnings: [] };
}
