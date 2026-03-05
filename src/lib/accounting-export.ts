/**
 * 会計ソフト連携CSV出力
 * 施術・物販・回数券の売上データ + 仕入データを仕訳形式で出力する
 *
 * 対応ソフト: freee / マネーフォワード / 弥生会計
 */

/** 仕訳1行分のデータ */
export type JournalEntry = {
  date: string; // YYYY-MM-DD
  debitAccount: string; // 借方勘定科目
  debitAmount: number; // 借方金額
  creditAccount: string; // 貸方勘定科目
  creditAmount: number; // 貸方金額
  taxCategory: string; // 税区分
  description: string; // 摘要
};

/** 決済区分 → 借方勘定科目のマッピング */
const DEBIT_ACCOUNT_MAP: Record<string, string> = {
  cash: "現金",
  credit: "売掛金",
  ticket: "前受金", // 回数券消化 = 前受金の取崩
};

/** 決済区分 → 税区分 */
const TAX_CATEGORY_MAP: Record<string, string> = {
  cash: "課対売上10%",
  credit: "課対売上10%",
  ticket: "課対売上10%",
};

/**
 * 施術・物販・回数券販売・仕入のデータから仕訳エントリを生成する
 */
export function buildJournalEntries(data: {
  treatments: {
    date: string;
    customerName: string;
    menuName: string;
    price: number;
    paymentType: string;
  }[];
  purchases: {
    date: string;
    customerName: string;
    itemName: string;
    totalPrice: number;
    paymentType?: string;
  }[];
  ticketSales: {
    date: string;
    customerName: string;
    ticketName: string;
    price: number;
    paymentType?: string;
  }[];
  inventoryPurchases?: {
    date: string;
    productName: string;
    amount: number;
  }[];
}): JournalEntry[] {
  const entries: JournalEntry[] = [];

  // 施術売上
  for (const t of data.treatments) {
    if (t.paymentType === "service") continue; // サービス（無償）は売上計上しない
    const debit = DEBIT_ACCOUNT_MAP[t.paymentType];
    if (!debit) continue;

    entries.push({
      date: t.date,
      debitAccount: debit,
      debitAmount: t.price,
      creditAccount: "売上高",
      creditAmount: t.price,
      taxCategory: TAX_CATEGORY_MAP[t.paymentType] ?? "",
      description: `施術 ${t.menuName}${t.customerName ? ` (${t.customerName})` : ""}`,
    });
  }

  // 物販売上
  for (const p of data.purchases) {
    const debit = p.paymentType === "credit" ? "売掛金" : "現金";
    entries.push({
      date: p.date,
      debitAccount: debit,
      debitAmount: p.totalPrice,
      creditAccount: "売上高",
      creditAmount: p.totalPrice,
      taxCategory: "課対売上10%",
      description: `物販 ${p.itemName}${p.customerName ? ` (${p.customerName})` : ""}`,
    });
  }

  // 回数券販売（前受金計上）
  for (const ts of data.ticketSales) {
    const debit = ts.paymentType === "credit" ? "売掛金" : "現金";
    entries.push({
      date: ts.date,
      debitAccount: debit,
      debitAmount: ts.price,
      creditAccount: "前受金",
      creditAmount: ts.price,
      taxCategory: "対象外",
      description: `回数券販売 ${ts.ticketName}${ts.customerName ? ` (${ts.customerName})` : ""}`,
    });
  }

  // 商品仕入（仕入高 / 現金）
  for (const ip of data.inventoryPurchases ?? []) {
    if (ip.amount <= 0) continue;
    entries.push({
      date: ip.date,
      debitAccount: "仕入高",
      debitAmount: ip.amount,
      creditAccount: "現金",
      creditAmount: ip.amount,
      taxCategory: "課対仕入10%",
      description: `商品仕入 ${ip.productName}`,
    });
  }

  // 日付順にソート
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries;
}

// --- フォーマット別CSV生成 ---

/** freee 仕訳CSV */
export function toFreeeCsv(entries: JournalEntry[]): string {
  const headers = [
    "収支区分",
    "管理番号",
    "発生日",
    "勘定科目",
    "税区分",
    "金額",
    "備考",
  ];
  const lines = [headers.map(escapeCsv).join(",")];

  for (const e of entries) {
    // freeeは収支区分で借方/貸方を表現
    // 仕入 = 「支出」（借方が仕入高）、それ以外 = 「収入」
    const isExpense = e.debitAccount === "仕入高";
    const type = isExpense ? "支出" : "収入";
    const account = isExpense ? e.debitAccount : e.creditAccount;
    const amount = isExpense ? e.debitAmount : e.creditAmount;
    lines.push(
      [
        type,
        "", // 管理番号（空）
        e.date,
        account,
        e.taxCategory,
        amount,
        e.description,
      ]
        .map(escapeCsv)
        .join(",")
    );
  }
  return lines.join("\n");
}

/** マネーフォワード 仕訳CSV */
export function toMoneyForwardCsv(entries: JournalEntry[]): string {
  const headers = [
    "取引No",
    "取引日",
    "借方勘定科目",
    "借方補助科目",
    "借方税区分",
    "借方金額",
    "借方税額",
    "貸方勘定科目",
    "貸方補助科目",
    "貸方税区分",
    "貸方金額",
    "貸方税額",
    "摘要",
  ];
  const lines = [headers.map(escapeCsv).join(",")];

  entries.forEach((e, i) => {
    lines.push(
      [
        i + 1,
        e.date,
        e.debitAccount,
        "", // 借方補助科目
        e.taxCategory,
        e.debitAmount,
        "", // 借方税額（自動計算に任せる）
        e.creditAccount,
        "", // 貸方補助科目
        e.taxCategory,
        e.creditAmount,
        "", // 貸方税額
        e.description,
      ]
        .map(escapeCsv)
        .join(",")
    );
  });
  return lines.join("\n");
}

/** 弥生会計 仕訳日記帳CSV */
export function toYayoiCsv(entries: JournalEntry[]): string {
  const headers = [
    "識別フラグ",
    "伝票No.",
    "決算",
    "取引日付",
    "借方勘定科目",
    "借方補助科目",
    "借方部門",
    "借方税区分",
    "借方金額",
    "借方税金額",
    "貸方勘定科目",
    "貸方補助科目",
    "貸方部門",
    "貸方税区分",
    "貸方金額",
    "貸方税金額",
    "摘要",
    "番号",
    "期日",
    "タイプ",
    "生成元",
    "仕訳メモ",
  ];
  const lines = [headers.map(escapeCsv).join(",")];

  // 弥生の税区分マッピング
  const yayoiTax = (cat: string) => {
    if (cat === "課対売上10%") return "課税売上込 10%";
    if (cat === "課対仕入10%") return "課税仕入込 10%";
    if (cat === "対象外") return "対象外";
    return "";
  };

  entries.forEach((e, i) => {
    lines.push(
      [
        2111, // 識別フラグ: 仕訳データ
        i + 1,
        "", // 決算
        e.date.replace(/-/g, "/"), // 弥生はYYYY/MM/DD形式
        e.debitAccount,
        "", // 借方補助科目
        "", // 借方部門
        yayoiTax(e.taxCategory),
        e.debitAmount,
        "", // 借方税金額
        e.creditAccount,
        "", // 貸方補助科目
        "", // 貸方部門
        yayoiTax(e.taxCategory),
        e.creditAmount,
        "", // 貸方税金額
        e.description,
        "", // 番号
        "", // 期日
        0, // タイプ
        "", // 生成元
        "salon-karte出力", // 仕訳メモ
      ]
        .map(escapeCsv)
        .join(",")
    );
  });
  return lines.join("\n");
}

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
