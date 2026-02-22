import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { PageHeader } from "@/components/layout/page-header";
import { ExportPanel } from "@/components/settings/export-panel";

export default async function ExportPage() {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  // 件数のみ取得（head: true でデータ転送ゼロ）
  const [customersRes, recordsRes, purchasesRes, appointmentsRes, ticketsRes] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
    supabase.from("treatment_records").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
    supabase.from("purchases").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
    supabase.from("course_tickets").select("id", { count: "exact", head: true }).eq("salon_id", salon.id),
  ]);

  const counts = {
    customers: customersRes.count ?? 0,
    records: recordsRes.count ?? 0,
    purchases: purchasesRes.count ?? 0,
    appointments: appointmentsRes.count ?? 0,
    courseTickets: ticketsRes.count ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="データエクスポート"
        breadcrumbs={[
          { label: "設定", href: "/settings" },
          { label: "データエクスポート" },
        ]}
      />
      <p className="text-sm text-text-light">各データをCSVファイルでダウンロードできます。</p>

      <ExportPanel counts={counts} />
    </div>
  );
}
