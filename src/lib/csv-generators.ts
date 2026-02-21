/** 確定申告用CSV生成ユーティリティ（freee / 弥生 / 汎用の3形式） */

export type CsvTaxReport = {
  opening_stock_value: number;
  closing_stock_value: number;
  total_purchases: number;
  cost_of_goods_sold: number;
  monthly_purchases: { month: number; amount: number }[];
  closing_stock_details: { product_name: string; stock: number; unit_price: number; total_value: number }[];
};

export type CsvMonthlySales = {
  month: number;
  treatment_sales: number;
  product_sales: number;
  ticket_sales: number;
};

/** 汎用CSV */
export function generateGenericCsv(report: CsvTaxReport, monthlySales: CsvMonthlySales[], year: number): string {
  const lines: string[] = [];
  lines.push(`${year}年 確定申告レポート`, "");

  lines.push("【売上原価】", "項目,金額");
  lines.push(`期首棚卸高,${report.opening_stock_value}`);
  lines.push(`当期仕入高,${report.total_purchases}`);
  lines.push(`期末棚卸高,${report.closing_stock_value}`);
  lines.push(`売上原価,${report.cost_of_goods_sold}`, "");

  lines.push("【月別売上】", "月,施術,物販,回数券,合計");
  for (const m of monthlySales) {
    const total = m.treatment_sales + m.product_sales + m.ticket_sales;
    lines.push(`${m.month},${m.treatment_sales},${m.product_sales},${m.ticket_sales},${total}`);
  }
  lines.push("");

  if (report.monthly_purchases.length > 0) {
    lines.push("【月別仕入】", "月,仕入金額");
    for (const mp of report.monthly_purchases) lines.push(`${mp.month},${mp.amount}`);
    lines.push("");
  }

  if (report.closing_stock_details.length > 0) {
    lines.push("【期末棚卸明細】", "商品名,在庫数,仕入単価,金額");
    for (const item of report.closing_stock_details) {
      lines.push(`"${item.product_name}",${item.stock},${item.unit_price},${item.total_value}`);
    }
  }

  return lines.join("\n");
}

/** freee取り込み形式 */
export function generateFreeeCsv(report: CsvTaxReport, monthlySales: CsvMonthlySales[], year: number): string {
  const lines: string[] = ["取引日,勘定科目,税区分,金額,摘要"];

  for (const m of monthlySales) {
    const date = `${year}/${String(m.month).padStart(2, "0")}/01`;
    if (m.treatment_sales > 0) lines.push(`${date},売上高,課税売上10%,${m.treatment_sales},施術売上 ${m.month}月分`);
    if (m.product_sales > 0) lines.push(`${date},売上高,課税売上10%,${m.product_sales},物販売上 ${m.month}月分`);
    if (m.ticket_sales > 0) lines.push(`${date},売上高,課税売上10%,${m.ticket_sales},回数券売上 ${m.month}月分`);
  }

  for (const mp of report.monthly_purchases) {
    const date = `${year}/${String(mp.month).padStart(2, "0")}/01`;
    lines.push(`${date},仕入高,課対仕入10%,${mp.amount},商品仕入 ${mp.month}月分`);
  }

  return lines.join("\n");
}

/** 弥生形式 */
export function generateYayoiCsv(report: CsvTaxReport, monthlySales: CsvMonthlySales[], year: number): string {
  const lines: string[] = ["仕訳日付,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要"];

  for (const m of monthlySales) {
    const total = m.treatment_sales + m.product_sales + m.ticket_sales;
    if (total > 0) {
      const date = `${year}/${String(m.month).padStart(2, "0")}/01`;
      lines.push(`${date},売掛金,${total},売上高,${total},${m.month}月 売上合計`);
    }
  }

  for (const mp of report.monthly_purchases) {
    const date = `${year}/${String(mp.month).padStart(2, "0")}/01`;
    lines.push(`${date},仕入高,${mp.amount},買掛金,${mp.amount},${mp.month}月 商品仕入`);
  }

  if (report.closing_stock_value > 0) {
    lines.push(`${year}/12/31,商品,${report.closing_stock_value},期末商品棚卸高,${report.closing_stock_value},期末棚卸`);
  }

  return lines.join("\n");
}

/** CSVダウンロード実行 */
export function downloadCsv(format: "generic" | "freee" | "yayoi", report: CsvTaxReport, monthlySales: CsvMonthlySales[], year: number) {
  const bom = "\uFEFF";
  let csvContent = "";
  if (format === "generic") csvContent = generateGenericCsv(report, monthlySales, year);
  else if (format === "freee") csvContent = generateFreeeCsv(report, monthlySales, year);
  else csvContent = generateYayoiCsv(report, monthlySales, year);

  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `確定申告_${year}年_${format}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
