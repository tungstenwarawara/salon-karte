import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { CustomerList } from "@/components/customers/customer-list";

export default async function CustomersPage() {
  const { user, salon, supabase } = await getAuthAndSalon();

  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  // 顧客データと来店統計を並列取得（Server Component なので初回HTMLに含まれる）
  const [customersResult, visitResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, last_name, first_name, last_name_kana, first_name_kana, phone")
      .eq("salon_id", salon.id)
      .order("last_name_kana", { ascending: true }),
    supabase
      .rpc("get_customer_visit_summary", { p_salon_id: salon.id })
      .returns<{ customer_id: string; visit_count: number; last_visit_date: string | null }[]>(),
  ]);

  const customerData = customersResult.data ?? [];
  const visitData = visitResult.data ?? [];

  // RPC結果をMapに変換
  const visitMap = new Map(visitData.map((v) => [v.customer_id, v]));

  const customers = customerData.map((c) => {
    const visit = visitMap.get(c.id);
    return {
      id: c.id,
      last_name: c.last_name,
      first_name: c.first_name,
      last_name_kana: c.last_name_kana,
      first_name_kana: c.first_name_kana,
      phone: c.phone,
      visit_count: visit?.visit_count ?? 0,
      last_visit_date: visit?.last_visit_date ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <CustomerList customers={customers} />
    </div>
  );
}
