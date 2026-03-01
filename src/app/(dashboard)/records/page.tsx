import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { PageHeader } from "@/components/layout/page-header";
import { RecordListSearch } from "@/components/records/record-list-search";
import { EmptyState } from "@/components/ui/empty-state";
import { FirstVisitHint } from "@/components/ui/first-visit-hint";

export default async function RecordsPage() {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  const { data: records } = await supabase
    .from("treatment_records")
    .select("id, treatment_date, menu_name_snapshot, customer_id, customers(id, last_name, first_name)")
    .eq("salon_id", salon.id)
    .order("treatment_date", { ascending: false })
    .order("created_at", { ascending: false });

  const allRecords = (records ?? []).map((r) => {
    const c = r.customers as { id: string; last_name: string; first_name: string } | null;
    return {
      id: r.id,
      treatmentDate: r.treatment_date,
      menuName: r.menu_name_snapshot ?? "施術記録",
      customerName: c ? `${c.last_name} ${c.first_name}` : "不明",
    };
  });

  return (
    <div className="space-y-4">
      <PageHeader title="カルテ" breadcrumbs={[{ label: "カルテ" }]}>
        <Link
          href="/records/new"
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center"
        >
          + カルテを登録
        </Link>
      </PageHeader>

      <FirstVisitHint pageKey="records" message="施術内容や写真をカルテに記録できます。予約なしでも直接作成できます" />

      <RecordListSearch records={allRecords} />

      {allRecords.length === 0 && (
        <EmptyState
          illustration="record"
          message="カルテはまだありません"
          action={{ label: "最初のカルテを登録する →", href: "/records/new" }}
        />
      )}
    </div>
  );
}
