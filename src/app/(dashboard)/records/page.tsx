import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { PageHeader } from "@/components/layout/page-header";
import { RecordListSearch } from "@/components/records/record-list-search";
import { EmptyState } from "@/components/ui/empty-state";
import { FirstVisitHint } from "@/components/ui/first-visit-hint";
import { LimitAwareCreateButton } from "@/components/plan/limit-aware-create-button";
import { PlanLimitWarning } from "@/components/plan/plan-limit-warning";
import type { PlanType } from "@/lib/plan";

export default async function RecordsPage() {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  const planType: PlanType = (salon.plan_type ?? "free") as PlanType;

  // 紹介特典の有無
  const { data: referralRow } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_salon_id", salon.id)
    .is("referred_reward_applied_at", null)
    .maybeSingle();
  const hasReferralBenefit = !!referralRow;

  // 今日・明日の日付（JST）
  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
  const tomorrowStr = new Date(Date.now() + 86400000).toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

  // カルテ + 今日・明日の予約を並列取得
  const [recordsResult, todayApptResult, tomorrowApptResult] = await Promise.all([
    supabase
      .from("treatment_records")
      .select("id, treatment_date, menu_name_snapshot, customer_id, record_type, notes_after, customers(id, last_name, first_name)")
      .eq("salon_id", salon.id)
      .order("treatment_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, customer_id, start_time, customers(id, last_name, first_name)")
      .eq("salon_id", salon.id)
      .eq("appointment_date", todayStr)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, customer_id, start_time, customers(id, last_name, first_name)")
      .eq("salon_id", salon.id)
      .eq("appointment_date", tomorrowStr)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true }),
  ]);

  const allRecords = (recordsResult.data ?? []).map((r) => {
    const c = r.customers as { id: string; last_name: string; first_name: string } | null;
    // 種別ごとにサマリーを切り替え（subtitle 表示用）
    const summary = (() => {
      if (r.record_type === "product_only") return "商品のみ購入";
      if (r.record_type === "cancelled") return r.notes_after?.slice(0, 30) || "キャンセル";
      if (r.record_type === "memo") return r.notes_after?.slice(0, 30) || "メモ";
      return r.menu_name_snapshot ?? "施術記録";
    })();
    return {
      id: r.id,
      treatmentDate: r.treatment_date,
      menuName: summary,
      recordType: r.record_type as "visit" | "product_only" | "cancelled" | "memo",
      customerName: c ? `${c.last_name} ${c.first_name}` : "不明",
      customerId: r.customer_id,
    };
  });

  const mapAppointments = (data: typeof todayApptResult.data) =>
    (data ?? []).map((a) => {
      const c = a.customers as { id: string; last_name: string; first_name: string } | null;
      return {
        id: a.id,
        customerId: a.customer_id,
        customerName: c ? `${c.last_name} ${c.first_name}` : "不明",
        startTime: a.start_time,
      };
    });

  const recordCount = allRecords.length;

  return (
    <div className="space-y-4">
      <PageHeader title="カルテ" breadcrumbs={[{ label: "カルテ" }]}>
        <LimitAwareCreateButton
          href="/records/new"
          label="+ カルテを登録"
          planType={planType}
          type="records"
          current={recordCount}
          hasReferralBenefit={hasReferralBenefit}
        />
      </PageHeader>

      <FirstVisitHint pageKey="records" message="施術内容や写真をカルテに記録できます。予約なしでも直接作成できます" />

      <PlanLimitWarning planType={planType} type="records" current={recordCount} />

      <RecordListSearch
        records={allRecords}
        todayAppointments={mapAppointments(todayApptResult.data)}
        tomorrowAppointments={mapAppointments(tomorrowApptResult.data)}
      />

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
