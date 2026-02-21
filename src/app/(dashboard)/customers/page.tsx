import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { CustomerList } from "@/components/customers/customer-list";

export default async function CustomersPage() {
  const { user, salon, supabase } = await getAuthAndSalon();

  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  // 顧客データと来店情報を並列取得（Server Component なので初回HTMLに含まれる）
  const [customersResult, visitResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, last_name, first_name, last_name_kana, first_name_kana, phone")
      .eq("salon_id", salon.id)
      .order("last_name_kana", { ascending: true }),
    supabase
      .from("treatment_records")
      .select("customer_id, treatment_date")
      .eq("salon_id", salon.id),
  ]);

  const customerData = customersResult.data ?? [];
  const visitData = visitResult.data ?? [];

  // 来店統計を集計
  const visitMap = new Map<string, { count: number; lastDate: string | null }>();
  for (const record of visitData) {
    const existing = visitMap.get(record.customer_id);
    if (existing) {
      existing.count++;
      if (!existing.lastDate || record.treatment_date > existing.lastDate) {
        existing.lastDate = record.treatment_date;
      }
    } else {
      visitMap.set(record.customer_id, {
        count: 1,
        lastDate: record.treatment_date,
      });
    }
  }

  const customers = customerData.map((c) => {
    const visit = visitMap.get(c.id);
    return {
      id: c.id,
      last_name: c.last_name,
      first_name: c.first_name,
      last_name_kana: c.last_name_kana,
      first_name_kana: c.first_name_kana,
      phone: c.phone,
      visit_count: visit?.count ?? 0,
      last_visit_date: visit?.lastDate ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <CustomerList customers={customers} />
    </div>
  );
}
