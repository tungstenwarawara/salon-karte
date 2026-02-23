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

type ProductRanking = {
  product_name: string;
  count: number;
  revenue: number;
};

export default async function AnalyticsPage() {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  const currentYear = new Date().getFullYear();

  const [ltvRes, repeatRes, menusRes, productsRes] = await Promise.all([
    supabase
      .rpc("get_customer_ltv_summary", { p_salon_id: salon.id })
      .returns<LtvRow[]>(),
    supabase
      .rpc("get_monthly_new_vs_returning", { p_salon_id: salon.id, p_year: currentYear })
      .returns<RepeatRow[]>(),
    supabase
      .rpc("get_menu_ranking", { p_salon_id: salon.id, p_limit: 10 })
      .returns<MenuRanking[]>(),
    supabase
      .rpc("get_product_ranking", { p_salon_id: salon.id, p_limit: 10 })
      .returns<ProductRanking[]>(),
  ]);

  const menus: MenuRanking[] = (menusRes.data as MenuRanking[]) ?? [];
  const products: ProductRanking[] = (productsRes.data as ProductRanking[]) ?? [];

  return (
    <AnalyticsView
      salonId={salon.id}
      initialLtv={(ltvRes.data as LtvRow[]) ?? []}
      initialRepeat={(repeatRes.data as RepeatRow[]) ?? []}
      initialYear={currentYear}
      menus={menus}
      products={products}
    />
  );
}
