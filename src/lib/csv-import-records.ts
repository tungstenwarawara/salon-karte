/**
 * 施術履歴CSVインポート — 検証ロジック
 */
import { splitName, parseBirthDate } from "./csv-parse";

// parseBirthDate は日付パーサーとして汎用的に使える（YYYY/M/D, YYYY-M-D, YYYY年M月D日）
const parseDate = parseBirthDate;

export type RecordRow = {
  treatment_date: string;       // YYYY-MM-DD
  customer_name: string;        // CSV上の元の名前
  customer_id: string | null;   // 解決されたID
  customer_match: string | null;// マッチした顧客の表示名
  menu_name: string;            // メニュー名テキスト
  menu_price: number | null;    // 料金
  purchase_item: string | null; // 物販商品名
  purchase_price: number | null;
  purchase_quantity: number;
  purchase_product_id: string | null; // 商品マスタから解決
  memo: string | null;
};

export type RecordRowValidation = {
  rowIndex: number;
  status: "ok" | "warning" | "error" | "skip";
  messages: string[];
  data: RecordRow;
  isDuplicate: boolean;
  checked: boolean;
};

export type ExistingCustomer = {
  id: string;
  last_name: string;
  first_name: string;
  last_name_kana: string | null;
  first_name_kana: string | null;
};

export type ExistingProduct = {
  id: string;
  name: string;
  base_sell_price: number;
  base_cost_price: number;
};

// ヘッダー名マッピング
const HEADER_MAP: Record<string, string> = {
  "日付": "date",
  "来店日": "date",
  "施術日": "date",
  "お客様名": "customer",
  "お客様": "customer",
  "顧客名": "customer",
  "氏名": "customer",
  "名前": "customer",
  "施術メニュー": "menu",
  "メニュー": "menu",
  "施術内容": "menu",
  "施術料金": "price",
  "料金": "price",
  "金額": "price",
  "物販商品": "product",
  "物販": "product",
  "商品": "product",
  "商品名": "product",
  "物販金額": "product_price",
  "物販単価": "product_price",
  "物販数量": "product_qty",
  "数量": "product_qty",
  "メモ": "memo",
  "備考": "memo",
};

export function detectRecordColumns(headers: string[]): Record<string, number> {
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
  const cleaned = value.replace(/[,，¥￥円]/g, "").trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

/** 顧客名からIDを解決 */
function resolveCustomer(
  rawName: string,
  customers: ExistingCustomer[],
): { id: string | null; displayName: string | null; message: string | null } {
  const { last, first } = splitName(rawName);
  if (!last) {
    return { id: null, displayName: null, message: "お客様名が空です" };
  }

  // 1. 姓名完全一致
  const exact = customers.filter(
    (c) => c.last_name === last && c.first_name === (first || "")
  );
  if (exact.length === 1) {
    return { id: exact[0].id, displayName: `${exact[0].last_name} ${exact[0].first_name}`, message: null };
  }
  if (exact.length > 1) {
    return { id: exact[0].id, displayName: `${exact[0].last_name} ${exact[0].first_name}`, message: `同名の顧客が${exact.length}名います` };
  }

  // 2. スペースなし連結一致（CSV上で「山田花子」のようにスペースなしの場合）
  const fullName = last + (first || "");
  const concat = customers.filter(
    (c) => (c.last_name + c.first_name) === fullName
  );
  if (concat.length === 1) {
    return { id: concat[0].id, displayName: `${concat[0].last_name} ${concat[0].first_name}`, message: null };
  }
  if (concat.length > 1) {
    return { id: concat[0].id, displayName: `${concat[0].last_name} ${concat[0].first_name}`, message: `同名の顧客が${concat.length}名います` };
  }

  // 3. カナ一致
  if (first) {
    const kana = customers.filter(
      (c) => c.last_name_kana === last && c.first_name_kana === first
    );
    if (kana.length === 1) {
      return { id: kana[0].id, displayName: `${kana[0].last_name} ${kana[0].first_name}`, message: "カナで一致" };
    }
  }

  // 4. 姓のみ一致（名がCSVにない場合）
  if (!first) {
    const lastOnly = customers.filter((c) => c.last_name === last);
    if (lastOnly.length === 1) {
      return { id: lastOnly[0].id, displayName: `${lastOnly[0].last_name} ${lastOnly[0].first_name}`, message: "姓のみで一致" };
    }
    if (lastOnly.length > 1) {
      return { id: null, displayName: null, message: `「${last}」が${lastOnly.length}名います。名前も入力してください` };
    }
  }

  return { id: null, displayName: null, message: `顧客が見つかりません: ${rawName}` };
}

/** 商品名からIDを解決 */
function resolveProduct(
  name: string,
  products: ExistingProduct[],
): { id: string | null; sellPrice: number; costPrice: number; message: string | null } {
  const trimmed = name.trim().toLowerCase();
  const match = products.find((p) => p.name.trim().toLowerCase() === trimmed);
  if (match) {
    return { id: match.id, sellPrice: match.base_sell_price, costPrice: match.base_cost_price, message: null };
  }
  return { id: null, sellPrice: 0, costPrice: 0, message: `商品マスタに未登録: ${name}（在庫連動なし）` };
}

export function validateRecordRows(
  headers: string[],
  rows: string[][],
  existingCustomers: ExistingCustomer[],
  existingProducts: ExistingProduct[],
): RecordRowValidation[] {
  const colMap = detectRecordColumns(headers);

  // 重複検出用マップ
  const seen = new Map<string, number>();

  return rows.map((row, i) => {
    const messages: string[] = [];
    let status: "ok" | "warning" | "error" = "ok";
    let isDuplicate = false;

    // 日付（必須）
    const dateRaw = colMap["date"] !== undefined ? (row[colMap["date"]] ?? "").trim() : "";
    const treatmentDate = dateRaw ? parseDate(dateRaw) : null;
    if (!dateRaw) {
      messages.push("日付が空です");
      status = "error";
    } else if (!treatmentDate) {
      messages.push("日付の形式が不正です");
      status = "error";
    }

    // 顧客名（必須）
    const customerRaw = colMap["customer"] !== undefined ? (row[colMap["customer"]] ?? "").trim() : "";
    const resolved = resolveCustomer(customerRaw, existingCustomers);
    if (!resolved.id) {
      if (status !== "error") status = "error";
      messages.push(resolved.message ?? "顧客が見つかりません");
    } else if (resolved.message) {
      if (status !== "error") status = "warning";
      messages.push(resolved.message);
    }

    // メニュー名
    const menuName = colMap["menu"] !== undefined ? (row[colMap["menu"]] ?? "").trim() : "";
    if (!menuName) {
      if (status !== "error") status = "warning";
      messages.push("メニュー名が空です");
    }

    // 料金
    const priceRaw = colMap["price"] !== undefined ? (row[colMap["price"]] ?? "") : "";
    const menuPrice = parsePrice(priceRaw);
    if (priceRaw.trim() && menuPrice === null) {
      messages.push("料金が不正です");
      if (status !== "error") status = "warning";
    }

    // 物販商品
    const productRaw = colMap["product"] !== undefined ? (row[colMap["product"]] ?? "").trim() : "";
    let purchaseProductId: string | null = null;
    let purchasePrice: number | null = null;
    let purchaseQty = 1;

    if (productRaw) {
      const prodResolved = resolveProduct(productRaw, existingProducts);
      purchaseProductId = prodResolved.id;
      if (prodResolved.message) {
        if (status !== "error") status = "warning";
        messages.push(prodResolved.message);
      }

      // 物販金額
      const ppRaw = colMap["product_price"] !== undefined ? (row[colMap["product_price"]] ?? "") : "";
      purchasePrice = parsePrice(ppRaw);
      if (!purchasePrice && prodResolved.id) {
        // 商品マスタの売価を使用
        purchasePrice = prodResolved.sellPrice;
      }

      // 物販数量
      const pqRaw = colMap["product_qty"] !== undefined ? (row[colMap["product_qty"]] ?? "") : "";
      if (pqRaw.trim()) {
        const q = parseInt(pqRaw.trim(), 10);
        if (!isNaN(q) && q > 0) purchaseQty = q;
      }
    }

    // メモ
    const memo = colMap["memo"] !== undefined ? (row[colMap["memo"]] ?? "").trim() || null : null;

    // 重複検出（同日+同顧客+同メニュー）
    if (resolved.id && treatmentDate) {
      const key = `${treatmentDate}|${resolved.id}|${menuName}`;
      if (seen.has(key)) {
        isDuplicate = true;
        messages.push(`CSV内で重複: 行${(seen.get(key)! + 1)}と同じ`);
        if (status !== "error") status = "warning";
      }
      seen.set(key, i);
    }

    return {
      rowIndex: i,
      status,
      messages,
      isDuplicate,
      checked: status !== "error" && !isDuplicate,
      data: {
        treatment_date: treatmentDate ?? "",
        customer_name: customerRaw,
        customer_id: resolved.id,
        customer_match: resolved.displayName,
        menu_name: menuName,
        menu_price: menuPrice,
        purchase_item: productRaw || null,
        purchase_price: purchasePrice,
        purchase_quantity: purchaseQty,
        purchase_product_id: purchaseProductId,
        memo,
      },
    };
  });
}
