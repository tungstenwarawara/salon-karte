import type { Database } from "@/types/database";

export type Menu = Database["public"]["Tables"]["treatment_menus"]["Row"];
export type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type CustomerOption = {
  id: string;
  last_name: string;
  first_name: string;
  last_name_kana: string | null;
  first_name_kana: string | null;
};

// 各メニューの支払情報
export type MenuPaymentInfo = {
  menuId: string;
  paymentType: "cash" | "credit" | "ticket" | "service";
  ticketId: string | null;
  priceOverride: number | null; // null = メニュー設定金額を使用
};

// カルテ内の回数券販売（保存前の仮データ）
export type PendingTicket = {
  ticket_name: string;
  total_sessions: number;
  price: number | null;
  memo: string;
};

// カルテ内の物販記録（保存前の仮データ）
export type PendingPurchase = {
  mode: "product" | "free";
  product_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  memo: string;
};

export const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";
