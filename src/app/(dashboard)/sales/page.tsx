import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { SalesView } from "@/components/sales/sales-view";
import type { MonthlySales } from "@/components/sales/sales-types";

export default async function SalesPage() {
  const { user, salon, supabase } = await getAuthAndSalon();

  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  const currentYear = new Date().getFullYear();

  // 売上サマリーを Server 側で取得（初回表示を高速化）
  const { data: salesData } = await supabase.rpc("get_monthly_sales_summary", {
    p_salon_id: salon.id,
    p_year: currentYear,
  });

  return (
    <SalesView
      salonId={salon.id}
      initialData={(salesData as MonthlySales[]) ?? []}
      initialYear={currentYear}
    />
  );
}
