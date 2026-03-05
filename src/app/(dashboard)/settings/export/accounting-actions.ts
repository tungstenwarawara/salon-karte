"use server";

import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import {
  buildJournalEntries,
  toFreeeCsv,
  toMoneyForwardCsv,
  toYayoiCsv,
} from "@/lib/accounting-export";

export type AccountingSoftware = "freee" | "moneyforward" | "yayoi";

type TreatmentRow = {
  treatment_date: string;
  customers: { last_name: string; first_name: string } | null;
  treatment_record_menus: {
    menu_name_snapshot: string;
    price_snapshot: number | null;
    payment_type: string;
  }[];
};

type PurchaseRow = {
  purchase_date: string;
  item_name: string;
  total_price: number;
  payment_type: string;
  customers: { last_name: string; first_name: string } | null;
};

type TicketRow = {
  purchase_date: string;
  ticket_name: string;
  price: number | null;
  payment_type: string;
  customers: { last_name: string; first_name: string } | null;
};

function customerName(c: { last_name: string; first_name: string } | null): string {
  return c ? `${c.last_name} ${c.first_name}`.trim() : "";
}

/**
 * 指定期間の売上データを取得し、会計ソフト用CSVを生成する
 */
export async function exportAccountingCsv(
  software: AccountingSoftware,
  startDate: string,
  endDate: string
): Promise<string> {
  const { salon, supabase } = await getAuthAndSalon();
  if (!salon) throw new Error("サロン未設定");

  // 並列でデータ取得
  const [treatmentsRes, purchasesRes, ticketsRes] = await Promise.all([
    // 施術カルテ（メニュー単位で売上）
    supabase
      .from("treatment_records")
      .select(
        "treatment_date, customers(last_name, first_name), treatment_record_menus(menu_name_snapshot, price_snapshot, payment_type)"
      )
      .eq("salon_id", salon.id)
      .gte("treatment_date", startDate)
      .lte("treatment_date", endDate)
      .order("treatment_date")
      .returns<TreatmentRow[]>(),

    // 物販
    supabase
      .from("purchases")
      .select("purchase_date, item_name, total_price, payment_type, customers(last_name, first_name)")
      .eq("salon_id", salon.id)
      .gte("purchase_date", startDate)
      .lte("purchase_date", endDate)
      .order("purchase_date")
      .returns<PurchaseRow[]>(),

    // 回数券販売
    supabase
      .from("course_tickets")
      .select("purchase_date, ticket_name, price, payment_type, customers(last_name, first_name)")
      .eq("salon_id", salon.id)
      .gte("purchase_date", startDate)
      .lte("purchase_date", endDate)
      .order("purchase_date")
      .returns<TicketRow[]>(),
  ]);

  // 仕訳データに変換
  const treatments = (treatmentsRes.data ?? []).flatMap((r) =>
    (r.treatment_record_menus ?? []).map((m) => ({
      date: r.treatment_date,
      customerName: customerName(r.customers),
      menuName: m.menu_name_snapshot,
      price: m.price_snapshot ?? 0,
      paymentType: m.payment_type,
    }))
  );

  const purchases = (purchasesRes.data ?? []).map((p) => ({
    date: p.purchase_date,
    customerName: customerName(p.customers),
    itemName: p.item_name,
    totalPrice: p.total_price,
    paymentType: p.payment_type ?? "cash",
  }));

  const ticketSales = (ticketsRes.data ?? [])
    .filter((t) => t.price != null && t.price > 0)
    .map((t) => ({
      date: t.purchase_date,
      customerName: customerName(t.customers),
      ticketName: t.ticket_name,
      price: t.price!,
      paymentType: t.payment_type ?? "cash",
    }));

  const entries = buildJournalEntries({ treatments, purchases, ticketSales });

  if (entries.length === 0) {
    throw new Error("指定期間にデータがありません");
  }

  // フォーマット別にCSV生成
  switch (software) {
    case "freee":
      return toFreeeCsv(entries);
    case "moneyforward":
      return toMoneyForwardCsv(entries);
    case "yayoi":
      return toYayoiCsv(entries);
  }
}
