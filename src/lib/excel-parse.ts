/**
 * Excel(.xlsx/.xls)ファイルをCSV形式のArrayBufferに変換するユーティリティ
 * xlsxライブラリ（SheetJS）を使用
 */
import * as XLSX from "xlsx";

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

/**
 * ExcelファイルのArrayBufferをCSV形式のArrayBufferに変換
 * 1シート目のデータのみを使用
 * cellDates: true で日付セルを Date オブジェクトとして取得し、YYYY/MM/DD に正規化
 */
export function excelToCSVBuffer(buffer: ArrayBuffer): ArrayBuffer {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Excelファイルにシートが見つかりません");
  }
  const sheet = workbook.Sheets[sheetName];

  // Date セルを YYYY/MM/DD 文字列に正規化（シリアル値出力を防止）
  const ref = sheet["!ref"];
  if (ref) {
    const range = XLSX.utils.decode_range(ref);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = sheet[addr];
        if (cell && cell.t === "d" && cell.v instanceof Date) {
          const dt = cell.v;
          const y = dt.getUTCFullYear();
          const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
          const d = String(dt.getUTCDate()).padStart(2, "0");
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
  return encoder.encode(csvText).buffer as ArrayBuffer;
}

/**
 * ファイルをCSV形式のArrayBufferに変換（CSV/Excel両対応）
 * - CSVファイル → そのままArrayBufferを返す
 * - Excelファイル → CSV形式に変換して返す
 */
export async function fileToCSVBuffer(file: File): Promise<ArrayBuffer> {
  const buffer = await file.arrayBuffer();
  if (isExcelFile(file)) {
    return excelToCSVBuffer(buffer);
  }
  return buffer;
}
