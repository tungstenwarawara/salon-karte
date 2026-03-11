/** 日計表 + 月間見込み 共通型定義 */

export type CustomerLedgerEntry = {
  customerId: string;
  customerName: string;
  treatments: { menuName: string; price: number; paymentType: string }[];
  purchases: { itemName: string; totalPrice: number; paymentType: string }[];
  ticketPurchases: { ticketName: string; price: number; paymentType: string }[];
};

export type DailyTotals = {
  total: number;
  cash: number;
  credit: number;
  ticket: number;
  service: number;
  treatmentTotal: number;
  purchaseTotal: number;
  ticketPurchaseTotal: number;
  customerCount: number;
};

export type ForecastEntry = {
  customerId: string;
  customerName: string;
  date: string;
  startTime: string;
  menus: { menuName: string; price: number }[];
  totalAmount: number;
};

export type DayGroupData = {
  date: string;
  isActual: boolean;
  entries: (CustomerLedgerEntry | ForecastEntry)[];
  dayTotal: number;
};

export const PAYMENT_LABELS: Record<string, string> = {
  cash: "現金",
  credit: "カード",
  ticket: "回数券",
  service: "サービス",
};

export function getCustomerTotal(entry: CustomerLedgerEntry): number {
  const t = entry.treatments.reduce((s, m) => s + m.price, 0);
  const p = entry.purchases.reduce((s, m) => s + m.totalPrice, 0);
  const k = entry.ticketPurchases.reduce((s, m) => s + m.price, 0);
  return t + p + k;
}

export function calcDailyTotals(entries: CustomerLedgerEntry[]): DailyTotals {
  const totals: DailyTotals = { total: 0, cash: 0, credit: 0, ticket: 0, service: 0, treatmentTotal: 0, purchaseTotal: 0, ticketPurchaseTotal: 0, customerCount: entries.length };
  for (const e of entries) {
    for (const m of e.treatments) {
      totals.treatmentTotal += m.price;
      if (m.paymentType === "cash") totals.cash += m.price;
      else if (m.paymentType === "credit") totals.credit += m.price;
      else if (m.paymentType === "ticket") totals.ticket += m.price;
      else if (m.paymentType === "service") totals.service += m.price;
    }
    for (const p of e.purchases) {
      totals.purchaseTotal += p.totalPrice;
      if (p.paymentType === "cash") totals.cash += p.totalPrice;
      else totals.credit += p.totalPrice;
    }
    for (const t of e.ticketPurchases) {
      totals.ticketPurchaseTotal += t.price;
      if (t.paymentType === "cash") totals.cash += t.price;
      else totals.credit += t.price;
    }
  }
  totals.total = totals.cash + totals.credit + totals.ticket + totals.service;
  return totals;
}

/** 日付を "3月11日（火）" 形式でフォーマット */
export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}
