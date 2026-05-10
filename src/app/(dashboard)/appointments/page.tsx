import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { AppointmentsView } from "@/components/appointments/appointments-view";
import type { AppointmentWithCustomer } from "@/components/appointments/appointment-card";
import { FirstVisitHint } from "@/components/ui/first-visit-hint";
import type { PlanType } from "@/lib/plan";

export default async function AppointmentsPage() {
  const { user, salon, supabase } = await getAuthAndSalon();

  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  const planType: PlanType = (salon.plan_type ?? "free") as PlanType;

  // 今月の予約を Server 側で取得（初回表示を高速化）
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startDate = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(first.getDate()).padStart(2, "0")}`;
  const endDate = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;

  const [{ data: appointments }, { count: monthlyAppointmentCount }, { data: referralRow }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, customers(last_name, first_name), staff(name)")
      .eq("salon_id", salon.id)
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })
      .returns<AppointmentWithCustomer[]>(),
    // プラン制限チェック用に当月の予約数を別途カウント（cancelled も含む全件）
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate),
    // 紹介特典の有無
    supabase
      .from("referrals")
      .select("id")
      .eq("referred_salon_id", salon.id)
      .is("referred_reward_applied_at", null)
      .maybeSingle(),
  ]);

  const hasReferralBenefit = !!referralRow;

  return (
    <div className="space-y-4">
      <FirstVisitHint pageKey="appointments" message="お客様を登録したら、予約を入れてみましょう。カレンダー形式でも確認できます" />
      <AppointmentsView
        salonId={salon.id}
        planType={planType}
        monthlyAppointmentCount={monthlyAppointmentCount ?? 0}
        hasReferralBenefit={hasReferralBenefit}
        initialAppointments={appointments ?? []}
        initialBusinessHours={salon.business_hours}
        initialSalonHolidays={salon.salon_holidays}
        initialHourOverrides={salon.hour_overrides}
      />
    </div>
  );
}
