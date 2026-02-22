import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { SalesView } from "@/components/sales/sales-view";
import type { MonthlySales } from "@/components/sales/sales-types";

export default async function SalesPage() {
  const { user, salon, supabase } = await getAuthAndSalon();

  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  const currentYear = new Date().getFullYear();

  // 売上サマリー + 前受金を Server 側で並列取得（初回表示を高速化）
  const [{ data: salesData }, { data: deferred }] = await Promise.all([
    supabase.rpc("get_monthly_sales_summary", { p_salon_id: salon.id, p_year: currentYear }),
    supabase.rpc("get_deferred_revenue", { p_salon_id: salon.id }),
  ]);

  return (
    <SalesView
      salonId={salon.id}
      initialData={(salesData as MonthlySales[]) ?? []}
      initialYear={currentYear}
      initialDeferredRevenue={(deferred as number) ?? 0}
    />
  );
}
