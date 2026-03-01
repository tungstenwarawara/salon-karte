export type MonthlySales = {
  month: number;
  treatment_sales: number;
  product_sales: number;
  ticket_sales: number;
  ticket_consumption: number;
  service_amount: number;
};

export type DailySales = {
  day: number;
  treatment: number;
  product: number;
  ticket: number;
  cash: number;
  credit: number;
};

export type CategoryFilter = "all" | "treatment" | "product" | "ticket";

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

export function getChangePercent(current: number, previous: number): { text: string; color: string } | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { text: "New", color: "text-green-600" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { text: `+${pct}%`, color: "text-green-600" };
  if (pct < 0) return { text: `${pct}%`, color: "text-red-500" };
  return { text: "±0%", color: "text-text-light" };
}

export function getFilteredTotal(m: MonthlySales, filter: CategoryFilter): number {
  if (filter === "treatment") return m.treatment_sales;
  if (filter === "product") return m.product_sales;
  if (filter === "ticket") return m.ticket_sales;
  return m.treatment_sales + m.product_sales + m.ticket_sales;
}

/** カテゴリ別バー背景色（Tailwindクラス） */
export function filterColor(filter: CategoryFilter): string {
  if (filter === "treatment") return "bg-category-treatment";
  if (filter === "product") return "bg-category-product";
  if (filter === "ticket") return "bg-category-ticket";
  return "bg-accent";
}

/** カテゴリフィルタピルのアクティブ色 */
export function categoryActiveClass(filter: CategoryFilter): string {
  if (filter === "treatment") return "bg-category-treatment text-white";
  if (filter === "product") return "bg-category-product text-white";
  if (filter === "ticket") return "bg-category-ticket text-white";
  return "bg-accent text-white";
}

/** 凡例ドット色 */
export function categoryDotColor(cat: "treatment" | "product" | "ticket"): string {
  if (cat === "treatment") return "bg-category-treatment";
  if (cat === "product") return "bg-category-product";
  return "bg-category-ticket";
}

/** バーチャート用グラデーション */
export function barGradient(filter: CategoryFilter, opacity: number): string {
  const colors: Record<CategoryFilter, [string, string]> = {
    treatment: [`rgba(228,168,158,${opacity})`, `rgba(238,190,182,${opacity})`],
    product: [`rgba(139,191,168,${opacity})`, `rgba(165,208,190,${opacity})`],
    ticket: [`rgba(196,160,184,${opacity})`, `rgba(212,182,202,${opacity})`],
    all: [`rgba(228,168,158,${opacity})`, `rgba(238,190,182,${opacity})`],
  };
  const [from, to] = colors[filter];
  return `linear-gradient(to top, ${from}, ${to})`;
}

export const CATEGORY_OPTIONS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "全体" },
  { key: "treatment", label: "施術" },
  { key: "product", label: "物販" },
  { key: "ticket", label: "回数券" },
];
