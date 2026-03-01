"use server";

import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { generateCsv } from "@/lib/csv-export";

// ラベル変換マップ
const PAYMENT_LABELS: Record<string, string> = {
  cash: "現金", credit: "クレジット", ticket: "回数券", service: "サービス",
};
const APPOINTMENT_STATUS: Record<string, string> = {
  scheduled: "予約済み", completed: "完了", cancelled: "キャンセル",
};
const TICKET_STATUS: Record<string, string> = {
  active: "有効", completed: "消化済み", expired: "期限切れ", cancelled: "キャンセル",
};
const SOURCE_LABELS: Record<string, string> = {
  hotpepper: "ホットペッパー", phone: "電話", line: "LINE", direct: "直接", other: "その他",
};

/** 顧客一覧CSV */
export async function exportCustomers(): Promise<string> {
  const { salon, supabase } = await getAuthAndSalon();
  if (!salon) throw new Error("サロン未設定");

  const { data } = await supabase
    .from("customers")
    .select("last_name, first_name, last_name_kana, first_name_kana, phone, email, birth_date, address, allergies, notes, dm_allowed, graduated_at, created_at")
    .eq("salon_id", salon.id)
    .order("last_name_kana");

  const headers = ["氏名", "フリガナ", "電話", "メール", "生年月日", "住所", "アレルギー", "メモ", "DM可", "ステータス", "登録日"];
  const rows = (data ?? []).map((c) => {
    const fullName = [c.last_name, c.first_name].filter(Boolean).join(" ");
    const fullKana = [c.last_name_kana, c.first_name_kana].filter(Boolean).join(" ");
    return [
      fullName, fullKana, c.phone, c.email, c.birth_date, c.address,
      c.allergies, c.notes, c.dm_allowed ? "○" : "×",
      c.graduated_at ? "卒業" : "有効", c.created_at?.slice(0, 10),
    ];
  });
  return generateCsv(headers, rows);
}

/** 施術履歴CSV */
export async function exportRecords(): Promise<string> {
  const { salon, supabase } = await getAuthAndSalon();
  if (!salon) throw new Error("サロン未設定");

  type Row = {
    id: string;
    treatment_date: string;
    treatment_area: string | null;
    products_used: string | null;
    skin_condition_before: string | null;
    notes_after: string | null;
    customers: { last_name: string; first_name: string } | null;
    treatment_record_menus: { menu_name_snapshot: string; price_snapshot: number | null; payment_type: string }[];
    purchases: { item_name: string; unit_price: number; quantity: number }[];
  };

  const { data } = await supabase
    .from("treatment_records")
    .select("id, treatment_date, treatment_area, products_used, skin_condition_before, notes_after, customers(last_name, first_name), treatment_record_menus(menu_name_snapshot, price_snapshot, payment_type), purchases(item_name, unit_price, quantity)")
    .eq("salon_id", salon.id)
    .order("treatment_date", { ascending: false })
    .returns<Row[]>();

  const headers = ["日付", "お客様名", "施術メニュー", "施術料金", "支払方法", "施術部位", "使用化粧品", "施術前の状態", "メモ", "物販商品", "物販金額", "物販数量"];
  const rows = (data ?? []).map((r) => {
    const menus = r.treatment_record_menus ?? [];
    const menuNames = menus.map((m) => m.menu_name_snapshot).join("、");
    const totalPrice = menus
      .filter((m) => m.payment_type === "cash" || m.payment_type === "credit")
      .reduce((sum, m) => sum + (m.price_snapshot ?? 0), 0);
    const paymentTypes = [...new Set(menus.map((m) => PAYMENT_LABELS[m.payment_type] ?? m.payment_type))].join("、");
    const customerName = r.customers ? `${r.customers.last_name} ${r.customers.first_name}` : "";
    const purchases = r.purchases ?? [];
    const purchaseNames = purchases.map((p) => p.item_name).join("、");
    const purchasePrices = purchases.length === 1 ? purchases[0].unit_price : purchases.length > 1 ? purchases.reduce((s, p) => s + p.unit_price, 0) : "";
    const purchaseQty = purchases.length === 1 ? purchases[0].quantity : purchases.length > 1 ? purchases.reduce((s, p) => s + p.quantity, 0) : "";
    return [
      r.treatment_date, customerName, menuNames, totalPrice || "",
      paymentTypes, r.treatment_area, r.products_used,
      r.skin_condition_before, r.notes_after,
      purchaseNames, purchasePrices, purchaseQty,
    ];
  });
  return generateCsv(headers, rows);
}

/** 物販記録CSV */
export async function exportPurchases(): Promise<string> {
  const { salon, supabase } = await getAuthAndSalon();
  if (!salon) throw new Error("サロン未設定");

  type Row = {
    purchase_date: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    memo: string | null;
    customers: { last_name: string; first_name: string } | null;
  };

  const { data } = await supabase
    .from("purchases")
    .select("purchase_date, item_name, quantity, unit_price, total_price, memo, customers(last_name, first_name)")
    .eq("salon_id", salon.id)
    .order("purchase_date", { ascending: false })
    .returns<Row[]>();

  const headers = ["日付", "顧客名", "商品名", "数量", "単価", "合計", "メモ"];
  const rows = (data ?? []).map((p) => {
    const customerName = p.customers ? `${p.customers.last_name} ${p.customers.first_name}` : "";
    return [p.purchase_date, customerName, p.item_name, p.quantity, p.unit_price, p.total_price, p.memo];
  });
  return generateCsv(headers, rows);
}

/** 予約一覧CSV */
export async function exportAppointments(): Promise<string> {
  const { salon, supabase } = await getAuthAndSalon();
  if (!salon) throw new Error("サロン未設定");

  type Row = {
    appointment_date: string;
    start_time: string;
    end_time: string | null;
    status: string;
    source: string | null;
    memo: string | null;
    customers: { last_name: string; first_name: string } | null;
    appointment_menus: { menu_name_snapshot: string }[];
  };

  const { data } = await supabase
    .from("appointments")
    .select("appointment_date, start_time, end_time, status, source, memo, customers(last_name, first_name), appointment_menus(menu_name_snapshot)")
    .eq("salon_id", salon.id)
    .order("appointment_date", { ascending: false })
    .returns<Row[]>();

  const headers = ["日付", "開始", "終了", "メニュー", "ステータス", "経路", "顧客名", "メモ"];
  const rows = (data ?? []).map((a) => {
    const customerName = a.customers ? `${a.customers.last_name} ${a.customers.first_name}` : "";
    const menuNames = (a.appointment_menus ?? []).map((m) => m.menu_name_snapshot).join("、");
    return [
      a.appointment_date,
      a.start_time?.slice(0, 5),
      a.end_time?.slice(0, 5) ?? "",
      menuNames,
      APPOINTMENT_STATUS[a.status] ?? a.status,
      SOURCE_LABELS[a.source ?? ""] ?? a.source,
      customerName,
      a.memo,
    ];
  });
  return generateCsv(headers, rows);
}

/** 施術メニューマスタCSV */
export async function exportTreatmentMenus(): Promise<string> {
  const { salon, supabase } = await getAuthAndSalon();
  if (!salon) throw new Error("サロン未設定");

  const { data } = await supabase
    .from("treatment_menus")
    .select("name, category, duration_minutes, price, is_active, created_at")
    .eq("salon_id", salon.id)
    .order("name");

  const headers = ["メニュー名", "カテゴリー", "施術時間(分)", "金額", "ステータス", "登録日"];
  const rows = (data ?? []).map((m) => [
    m.name, m.category, m.duration_minutes ?? "", m.price ?? "",
    m.is_active ? "有効" : "無効", m.created_at?.slice(0, 10),
  ]);
  return generateCsv(headers, rows);
}

/** 商品マスタCSV */
export async function exportProducts(): Promise<string> {
  const { salon, supabase } = await getAuthAndSalon();
  if (!salon) throw new Error("サロン未設定");

  const { data } = await supabase
    .from("products")
    .select("name, category, base_sell_price, base_cost_price, reorder_point, is_active, memo, created_at")
    .eq("salon_id", salon.id)
    .order("name");

  const headers = ["商品名", "カテゴリー", "販売価格", "仕入価格", "発注点", "ステータス", "メモ", "登録日"];
  const rows = (data ?? []).map((p) => [
    p.name, p.category, p.base_sell_price, p.base_cost_price,
    p.reorder_point, p.is_active ? "有効" : "無効",
    p.memo, p.created_at?.slice(0, 10),
  ]);
  return generateCsv(headers, rows);
}

/** 回数券一覧CSV */
export async function exportCourseTickets(): Promise<string> {
  const { salon, supabase } = await getAuthAndSalon();
  if (!salon) throw new Error("サロン未設定");

  type Row = {
    ticket_name: string;
    total_sessions: number;
    used_sessions: number;
    purchase_date: string;
    expiry_date: string | null;
    price: number | null;
    status: string;
    memo: string | null;
    customers: { last_name: string; first_name: string } | null;
  };

  const { data } = await supabase
    .from("course_tickets")
    .select("ticket_name, total_sessions, used_sessions, purchase_date, expiry_date, price, status, memo, customers(last_name, first_name)")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false })
    .returns<Row[]>();

  const headers = ["顧客名", "チケット名", "総回数", "使用回数", "残回数", "金額", "ステータス", "購入日", "有効期限", "メモ"];
  const rows = (data ?? []).map((t) => {
    const customerName = t.customers ? `${t.customers.last_name} ${t.customers.first_name}` : "";
    return [
      customerName, t.ticket_name, t.total_sessions, t.used_sessions,
      t.total_sessions - t.used_sessions, t.price ?? "",
      TICKET_STATUS[t.status] ?? t.status,
      t.purchase_date, t.expiry_date, t.memo,
    ];
  });
  return generateCsv(headers, rows);
}
