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

export function filterColor(filter: CategoryFilter): string {
  if (filter === "treatment") return "bg-accent";
  if (filter === "product") return "bg-blue-400";
  if (filter === "ticket") return "bg-amber-400";
  return "bg-accent";
}

export const CATEGORY_OPTIONS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "全体" },
  { key: "treatment", label: "施術" },
  { key: "product", label: "物販" },
  { key: "ticket", label: "回数券" },
];
