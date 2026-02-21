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
 */
export function excelToCSVBuffer(buffer: ArrayBuffer): ArrayBuffer {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Excelファイルにシートが見つかりません");
  }
  const sheet = workbook.Sheets[sheetName];
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
