/**
 * CSV解析ユーティリティ
 * - Shift-JIS / UTF-8 自動判定
 * - クォート対応パーサー
 * - 顧客インポート向けバリデーション
 */

// ---------- 型定義 ----------

export type CsvParseResult = {
  headers: string[];
  rows: string[][];
  encoding: string;
};

export type CustomerRow = {
  last_name: string;
  first_name: string;
  last_name_kana: string | null;
  first_name_kana: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type RowValidation = {
  rowIndex: number;
  status: "ok" | "warning" | "error" | "skip";
  messages: string[];
  data: CustomerRow;
  isDuplicate: boolean;
  duplicateMatch?: string;
  checked: boolean;
};

type ExistingCustomer = {
  last_name: string;
  first_name: string;
  phone: string | null;
  email: string | null;
};

// ---------- CSV パース ----------

/** ArrayBufferからCSVを解析（エンコーディング自動判定） */
export function parseCSV(buffer: ArrayBuffer): CsvParseResult {
  const bytes = new Uint8Array(buffer);
  const hasUtf8Bom = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;

  let text: string;
  let encoding: string;

  if (hasUtf8Bom) {
    text = new TextDecoder("utf-8").decode(buffer);
    encoding = "UTF-8";
  } else {
    text = new TextDecoder("shift-jis").decode(buffer);
    encoding = "Shift-JIS";
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    return { headers: [], rows: [], encoding };
  }

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);

  return { headers, rows, encoding };
}

/** CSV1行をフィールド配列に分解（クォート対応） */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ---------- 列マッピング ----------

/** ヘッダー名 → カラムインデックスのマッピング */
const HEADER_MAP: Record<string, string> = {
  氏名: "name",
  名前: "name",
  フリガナ: "kana",
  ふりがな: "kana",
  カナ: "kana",
  生年月日: "birth_date",
  住所: "address",
  メール: "email",
  "メールアドレス": "email",
  "Eメール": "email",
  電話: "phone",
  電話番号: "phone",
  TEL: "phone",
};

type ColumnMap = {
  name: number;
  kana: number;
  birth_date: number;
  address: number;
  email: number;
  phone: number;
};

/** ヘッダーからカラムマッピングを検出 */
export function detectColumns(headers: string[]): { map: Partial<ColumnMap>; missing: string[] } {
  const map: Partial<ColumnMap> = {};
  const found = new Set<string>();

  headers.forEach((h, i) => {
    const normalized = h.trim().replace(/\s+/g, "");
    for (const [key, col] of Object.entries(HEADER_MAP)) {
      if (normalized === key || normalized.includes(key)) {
        if (!found.has(col)) {
          (map as Record<string, number>)[col] = i;
          found.add(col);
        }
        break;
      }
    }
  });

  const missing: string[] = [];
  if (map.name === undefined) missing.push("氏名");

  return { map, missing };
}

// ---------- 名前分割 ----------

/** フルネームを姓・名に分割 */
export function splitName(fullName: string): { last: string; first: string } {
  const trimmed = fullName.trim();
  // 半角スペースまたは全角スペースで分割
  const parts = trimmed.split(/[\s\u3000]+/);
  if (parts.length >= 2) {
    return { last: parts[0], first: parts.slice(1).join(" ") };
  }
  // スペースなし → 姓のみ（firstは空 → エラー扱い）
  return { last: parts[0], first: "" };
}

// ---------- 日付パース ----------

/** Excelシリアル値をDateに変換（1900年基準、うるう年バグ考慮） */
function excelSerialToDate(serial: number): Date | null {
  if (serial < 1 || serial > 60000) return null;
  // Excelは1900-01-00を起点、シリアル60=1900-02-29（存在しない日）を含むバグあり
  const epoch = Date.UTC(1899, 11, 30);
  return new Date(epoch + serial * 86400000);
}

/** 生年月日文字列をYYYY-MM-DD形式に変換 */
export function parseBirthDate(value: string): string | null {
  if (!value || !value.trim()) return null;

  const v = value.trim();

  // YYYY/M/D or YYYY-M-D or YYYY年M月D日
  const match = v.match(/(\d{4})[/\-年](\d{1,2})[/\-月](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    const dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2030) {
      return dateStr;
    }
  }

  // Excelシリアル値（4〜5桁の数字のみ）
  if (/^\d{4,5}$/.test(v)) {
    const serial = parseInt(v, 10);
    const date = excelSerialToDate(serial);
    if (date) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      if (y >= 1900 && y <= 2030) {
        return `${y}-${m}-${d}`;
      }
    }
  }

  return null;
}

/**
 * M月D日 形式（年なし）から月日を抽出
 * 年を含む形式の場合は null を返す（parseBirthDate で処理済み）
 */
export function parseDateWithoutYear(value: string): { month: number; day: number } | null {
  if (!value || !value.trim()) return null;
  const v = value.trim();

  // 先頭が4桁の年で始まる場合はスキップ（年あり形式）
  if (/^\d{4}/.test(v)) return null;

  // M月D日 or M月D
  const jpMatch = v.match(/^(\d{1,2})月(\d{1,2})日?$/);
  if (jpMatch) {
    const m = parseInt(jpMatch[1], 10);
    const d = parseInt(jpMatch[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { month: m, day: d };
    }
  }

  // M/D（年なしスラッシュ形式）
  const slashMatch = v.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (slashMatch) {
    const m = parseInt(slashMatch[1], 10);
    const d = parseInt(slashMatch[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { month: m, day: d };
    }
  }

  return null;
}

// ---------- 重複検出 ----------

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()（）\u3000]/g, "");
}

function checkDuplicate(
  row: CustomerRow,
  existing: ExistingCustomer[],
): { isDuplicate: boolean; match?: string } {
  for (const c of existing) {
    // 電話番号一致（最強シグナル）
    if (row.phone && c.phone) {
      if (normalizePhone(row.phone) === normalizePhone(c.phone)) {
        return { isDuplicate: true, match: `電話番号が一致: ${c.last_name} ${c.first_name}` };
      }
    }
    // メール一致
    if (row.email && c.email) {
      if (row.email.toLowerCase() === c.email.toLowerCase()) {
        return { isDuplicate: true, match: `メールが一致: ${c.last_name} ${c.first_name}` };
      }
    }
    // 同姓同名
    if (row.last_name === c.last_name && row.first_name === c.first_name) {
      return { isDuplicate: true, match: `同姓同名: ${c.last_name} ${c.first_name}` };
    }
  }
  return { isDuplicate: false };
}

// ---------- 行バリデーション ----------

/** CSVの全行をバリデーションしてRowValidation配列を返す */
export function validateRows(
  headers: string[],
  rows: string[][],
  existingCustomers: ExistingCustomer[],
): RowValidation[] {
  const { map, missing } = detectColumns(headers);

  if (missing.length > 0) {
    return [{
      rowIndex: 0,
      status: "error",
      messages: [`必須列が見つかりません: ${missing.join(", ")}`],
      data: { last_name: "", first_name: "", last_name_kana: null, first_name_kana: null, birth_date: null, phone: null, email: null, address: null },
      isDuplicate: false,
      checked: false,
    }];
  }

  const getValue = (row: string[], col: keyof ColumnMap): string => {
    const idx = map[col];
    if (idx === undefined || idx >= row.length) return "";
    return row[idx].trim();
  };

  return rows.map((row, i) => {
    const messages: string[] = [];

    // 空行スキップ
    const isEmptyRow = row.every((cell) => !cell.trim());
    if (isEmptyRow) {
      return {
        rowIndex: i + 1,
        status: "skip" as const,
        messages: [],
        data: { last_name: "", first_name: "", last_name_kana: null, first_name_kana: null, birth_date: null, phone: null, email: null, address: null },
        isDuplicate: false,
        checked: false,
      };
    }

    // 氏名分割
    const nameRaw = getValue(row, "name");
    const { last, first } = splitName(nameRaw);

    if (!nameRaw) {
      return {
        rowIndex: i + 1,
        status: "error" as const,
        messages: ["氏名が空です"],
        data: { last_name: "", first_name: "", last_name_kana: null, first_name_kana: null, birth_date: null, phone: null, email: null, address: null },
        isDuplicate: false,
        checked: false,
      };
    }

    if (!first) {
      messages.push("氏名にスペースがないため姓のみ登録されます");
    }

    // フリガナ分割
    const kanaRaw = getValue(row, "kana");
    let lastKana: string | null = null;
    let firstKana: string | null = null;
    if (kanaRaw) {
      const kanaParts = splitName(kanaRaw);
      lastKana = kanaParts.last || null;
      firstKana = kanaParts.first || null;
    }

    // 生年月日
    const birthRaw = getValue(row, "birth_date");
    const birthDate = parseBirthDate(birthRaw);
    if (birthRaw && !birthDate) {
      messages.push(`生年月日を解析できません: ${birthRaw}`);
    }

    // メール簡易チェック
    const email = getValue(row, "email") || null;
    if (email && !email.includes("@")) {
      messages.push("メールアドレスの形式が不正です");
    }

    // 電話
    const phone = getValue(row, "phone") || null;

    // 住所
    const address = getValue(row, "address") || null;

    const data: CustomerRow = {
      last_name: last,
      first_name: first,
      last_name_kana: lastKana,
      first_name_kana: firstKana,
      birth_date: birthDate,
      phone,
      email,
      address,
    };

    // 重複チェック
    const dup = checkDuplicate(data, existingCustomers);

    const hasError = !nameRaw;
    const status = hasError ? "error" : messages.length > 0 || dup.isDuplicate ? "warning" : "ok";

    return {
      rowIndex: i + 1,
      status,
      messages: dup.isDuplicate ? [...messages, dup.match!] : messages,
      data,
      isDuplicate: dup.isDuplicate,
      duplicateMatch: dup.match,
      checked: !dup.isDuplicate && status !== "error",
    };
  });
}
