import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
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
      <Link
        href="/settings"
        className="flex items-center gap-1 text-sm text-accent hover:underline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        設定
      </Link>

      <h2 className="text-xl font-bold">データエクスポート</h2>
      <p className="text-sm text-text-light">各データをCSVファイルでダウンロードできます。</p>

      <ExportPanel counts={counts} />
    </div>
  );
}
