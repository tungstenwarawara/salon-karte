import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { AnalyticsView } from "@/components/sales/analytics-view";
import type { MenuRanking } from "@/components/sales/treatment-ranking";

type LtvRow = {
  customer_id: string;
  last_name: string;
  first_name: string;
  visit_count: number;
  treatment_revenue: number;
  purchase_revenue: number;
  ticket_revenue: number;
  first_visit_date: string | null;
  last_visit_date: string | null;
};

type RepeatRow = {
  month: number;
  new_customers: number;
  returning_customers: number;
};

type MenuAgg = {
  menu_name_snapshot: string;
  count: number;
  revenue: number;
};

export default async function AnalyticsPage() {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  const currentYear = new Date().getFullYear();

  const [ltvRes, repeatRes, menusRes] = await Promise.all([
    supabase
      .rpc("get_customer_ltv_summary", { p_salon_id: salon.id })
      .returns<LtvRow[]>(),
    supabase
      .rpc("get_monthly_new_vs_returning", { p_salon_id: salon.id, p_year: currentYear })
      .returns<RepeatRow[]>(),
    // 人気メニュー: treatment_record_menus を集計
    supabase
      .from("treatment_record_menus")
      .select("menu_name_snapshot, price_snapshot, payment_type, treatment_records!inner(salon_id)")
      .eq("treatment_records.salon_id", salon.id)
      .returns<{ menu_name_snapshot: string; price_snapshot: number | null; payment_type: string }[]>(),
  ]);

  // メニュー集計をJS側で実行（GROUP BYの代わり）
  const menuMap = new Map<string, { count: number; revenue: number }>();
  for (const m of menusRes.data ?? []) {
    const existing = menuMap.get(m.menu_name_snapshot) ?? { count: 0, revenue: 0 };
    existing.count += 1;
    if (m.payment_type === "cash" || m.payment_type === "credit") {
      existing.revenue += m.price_snapshot ?? 0;
    }
    menuMap.set(m.menu_name_snapshot, existing);
  }
  const menus: MenuRanking[] = Array.from(menuMap.entries())
    .map(([menu_name, data]) => ({ menu_name, count: data.count, revenue: data.revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <AnalyticsView
      salonId={salon.id}
      initialLtv={(ltvRes.data as LtvRow[]) ?? []}
      initialRepeat={(repeatRes.data as RepeatRow[]) ?? []}
      initialYear={currentYear}
      menus={menus}
    />
  );
}
