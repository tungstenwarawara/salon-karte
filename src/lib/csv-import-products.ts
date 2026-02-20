/**
 * 商品CSVインポート — 検証ロジック
 */

export type ProductRow = {
  name: string;
  category: string | null;
  base_sell_price: number;
  base_cost_price: number;
  reorder_point: number;
  memo: string | null;
};

export type ProductRowValidation = {
  rowIndex: number;
  status: "ok" | "warning" | "error" | "skip";
  messages: string[];
  data: ProductRow;
  isDuplicate: boolean;
  duplicateMatch?: string;
  checked: boolean;
};

// ヘッダー名 → 内部カラム名のマッピング
const HEADER_MAP: Record<string, string> = {
  "商品名": "name",
  "商品": "name",
  "名前": "name",
  "カテゴリ": "category",
  "分類": "category",
  "販売価格": "sell_price",
  "売価": "sell_price",
  "販売単価": "sell_price",
  "仕入価格": "cost_price",
  "仕入": "cost_price",
  "原価": "cost_price",
  "仕入単価": "cost_price",
  "発注点": "reorder_point",
  "メモ": "memo",
  "備考": "memo",
};

export function detectProductColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    const trimmed = h.trim();
    const col = HEADER_MAP[trimmed];
    if (col && !(col in map)) {
      map[col] = i;
    }
  });
  return map;
}

function parsePrice(value: string): number | null {
  if (!value.trim()) return null;
  // カンマ・円記号を除去
  const cleaned = value.replace(/[,，¥￥円]/g, "").trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

export function validateProductRows(
  headers: string[],
  rows: string[][],
  existingProducts: { name: string }[],
): ProductRowValidation[] {
  const colMap = detectProductColumns(headers);
  const existingNames = new Set(
    existingProducts.map((p) => p.name.trim().toLowerCase())
  );

  return rows.map((row, i) => {
    const messages: string[] = [];
    let status: "ok" | "warning" | "error" = "ok";
    let isDuplicate = false;

    // 商品名（必須）
    const nameIdx = colMap["name"];
    const name = nameIdx !== undefined ? (row[nameIdx] ?? "").trim() : "";
    if (!name) {
      messages.push("商品名が空です");
      status = "error";
    }

    // 重複チェック
    if (name && existingNames.has(name.toLowerCase())) {
      isDuplicate = true;
      messages.push(`「${name}」は登録済みです`);
    }

    // 販売価格
    const sellRaw = colMap["sell_price"] !== undefined ? (row[colMap["sell_price"]] ?? "") : "";
    const sellPrice = parsePrice(sellRaw);
    if (sellRaw.trim() && sellPrice === null) {
      messages.push("販売価格が不正です");
      status = "error";
    }

    // 仕入価格
    const costRaw = colMap["cost_price"] !== undefined ? (row[colMap["cost_price"]] ?? "") : "";
    const costPrice = parsePrice(costRaw);
    if (costRaw.trim() && costPrice === null) {
      messages.push("仕入価格が不正です");
      status = "error";
    }

    // 発注点
    const reorderRaw = colMap["reorder_point"] !== undefined ? (row[colMap["reorder_point"]] ?? "") : "";
    const reorderPoint = reorderRaw.trim() ? parseInt(reorderRaw.trim(), 10) : 3;
    if (reorderRaw.trim() && isNaN(reorderPoint)) {
      messages.push("発注点が不正です");
      if (status !== "error") status = "warning";
    }

    // カテゴリ・メモ
    const category = colMap["category"] !== undefined ? (row[colMap["category"]] ?? "").trim() || null : null;
    const memo = colMap["memo"] !== undefined ? (row[colMap["memo"]] ?? "").trim() || null : null;

    return {
      rowIndex: i,
      status,
      messages,
      isDuplicate,
      checked: status !== "error" && !isDuplicate,
      data: {
        name,
        category,
        base_sell_price: sellPrice ?? 0,
        base_cost_price: costPrice ?? 0,
        reorder_point: isNaN(reorderPoint) ? 3 : reorderPoint,
        memo,
      },
    };
  });
}
