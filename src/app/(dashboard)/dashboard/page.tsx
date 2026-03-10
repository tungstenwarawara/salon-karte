import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import type { Database } from "@/types/database";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { InventoryAlert } from "@/components/dashboard/inventory-alert";
import { TodayAppointments } from "@/components/dashboard/today-appointments";
import { BirthdayCustomers } from "@/components/dashboard/birthday-customers";
import { KpiTrendCards } from "@/components/dashboard/kpi-trend-cards";
import { GreetingVisual } from "@/components/dashboard/greeting-visual";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "おはようございます";
  if (hour < 17) return "こんにちは";
  return "おつかれさまです";
}

export default async function DashboardPage() {
  const { user, salon, staff, supabase } = await getAuthAndSalon();

  if (!user) {
    redirect("/login");
  }

  if (!salon) {
    redirect("/setup");
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentMonth = now.getMonth() + 1;

  type LapsedCustomer = {
    id: string;
    last_name: string;
    first_name: string;
    last_visit_date: string;
    days_since: number;
  };
  type InventoryAlertItem = {
    product_id: string;
    product_name: string;
    current_stock: number;
    reorder_point: number;
  };
  type DashboardKpi = {
    current_month_revenue: number;
    previous_month_revenue: number;
    current_month_visits: number;
    previous_month_visits: number;
  };

  const [
    todayAppointmentsRes,
    customerCountRes,
    menuCountRes,
    appointmentTotalRes,
    recordTotalRes,
    lapsedCustomersRes,
    birthdayRes,
    inventoryRes,
    kpiRes,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, customer_id, start_time, status, menu_name_snapshot, customers(last_name, first_name), staff(name)")
      .eq("salon_id", salon.id)
      .eq("appointment_date", today)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true })
      .returns<(Appointment & { customers: { last_name: string; first_name: string } | null; staff: { name: string } | null })[]>(),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id),
    supabase
      .from("treatment_menus")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .eq("is_active", true),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id),
    supabase
      .from("treatment_records")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id),
    supabase
      .rpc("get_lapsed_customers", { p_salon_id: salon.id, p_days_threshold: 60 })
      .returns<LapsedCustomer[]>(),
    supabase
      .from("customers")
      .select("id, last_name, first_name, birth_date")
      .eq("salon_id", salon.id)
      .not("birth_date", "is", null),
    supabase
      .rpc("get_inventory_summary", { p_salon_id: salon.id })
      .returns<InventoryAlertItem[]>(),
    supabase
      .rpc("get_dashboard_kpi", { p_salon_id: salon.id })
      .returns<DashboardKpi[]>(),
  ]);

  const todayAppointments = todayAppointmentsRes.data;
  const customerCount = customerCountRes.count;
  const menuCount = menuCountRes.count;
  const lapsedCustomers = lapsedCustomersRes.data as LapsedCustomer[] | null;

  // 今日の予約顧客のみ前回来店日を取得（200件一括取得を廃止 → 必要分だけに最適化）
  const lastVisitMap: Record<string, string> = {};
  if (todayAppointments && todayAppointments.length > 0) {
    const customerIds = [...new Set(todayAppointments.map((a) => a.customer_id).filter(Boolean))] as string[];
    if (customerIds.length > 0) {
      const { data: lastVisits } = await supabase
        .from("treatment_records")
        .select("customer_id, treatment_date")
        .eq("salon_id", salon.id)
        .in("customer_id", customerIds)
        .order("treatment_date", { ascending: false });
      if (lastVisits) {
        for (const v of lastVisits) {
          if (!lastVisitMap[v.customer_id]) {
            lastVisitMap[v.customer_id] = v.treatment_date;
          }
        }
      }
    }
  }

  const kpi = kpiRes.data?.[0] ?? {
    current_month_revenue: 0,
    previous_month_revenue: 0,
    current_month_visits: 0,
    previous_month_visits: 0,
  };

  // 在庫アラート: 在庫が発注点以下の商品を抽出
  const lowStockItems = (inventoryRes.data ?? []).filter(
    (item) => item.current_stock <= item.reorder_point
  );

  // 誕生日（JS側で月フィルタ — date型にLIKEは使えないため）
  const monthStr = String(currentMonth).padStart(2, "0");
  const birthdayCustomers = (birthdayRes.data ?? [])
    .filter((c) => c.birth_date && c.birth_date.split("-")[1] === monthStr)
    .map((c) => ({
      ...c,
      birth_day: parseInt(c.birth_date!.split("-")[2], 10) || 1,
    }))
    .sort((a, b) => a.birth_day - b.birth_day);

  // 表示用の集計値
  const appointmentCount = todayAppointments?.filter((a) => a.status === "scheduled").length ?? 0;
  const lapsedCount = lapsedCustomers?.length ?? 0;

  // オンボーディング
  const hasBusinessHours = salon.business_hours !== null;
  const hasMenus = (menuCount ?? 0) > 0;
  const hasCustomers = (customerCount ?? 0) > 0;
  const hasAppointments = (appointmentTotalRes.count ?? 0) > 0;
  const hasRecords = (recordTotalRes.count ?? 0) > 0;
  const setupSteps: { done: boolean; label: string; href: string; phase: 1 | 2 }[] = [
    { done: true, label: "サロン登録", href: "/dashboard", phase: 1 },
    { done: hasBusinessHours, label: "営業時間を設定する", href: "/settings/business-hours", phase: 1 },
    { done: hasMenus, label: "施術メニューを登録する", href: "/settings/menus", phase: 1 },
    { done: hasCustomers, label: "最初のお客様を登録する", href: "/customers/new", phase: 1 },
    { done: hasAppointments, label: "予約を入れてみる", href: "/appointments/new", phase: 2 },
    { done: hasRecords, label: "カルテを記録する", href: "/records/new", phase: 2 },
  ];
  const allSetupDone = setupSteps.every((s) => s.done);

  return (
    <div className="space-y-5">
      {/* 挨拶 + ビジュアル */}
      <div className="animate-fade-in-up">
        <GreetingVisual />
        <div className="mt-2 text-center">
          <p className="text-text-light text-sm">{getGreeting()}</p>
          <h2 className="text-xl font-bold mt-0.5">{salon.name}</h2>
        </div>
      </div>

      {!allSetupDone && (
        <div className="animate-fade-in-up animation-delay-100">
          <OnboardingChecklist setupSteps={setupSteps} />
        </div>
      )}

      <div className="animate-fade-in-up animation-delay-100">
        <SummaryCards
          appointmentCount={appointmentCount}
          lapsedCount={lapsedCount}
          customerCount={customerCount ?? 0}
        />
      </div>

      <div className="animate-fade-in-up animation-delay-200">
        <KpiTrendCards
          currentRevenue={kpi.current_month_revenue}
          previousRevenue={kpi.previous_month_revenue}
          currentVisits={kpi.current_month_visits}
          previousVisits={kpi.previous_month_visits}
          staffRole={staff?.role ?? null}
        />
      </div>

      {lowStockItems.length > 0 && (
        <div className="animate-fade-in-up animation-delay-300">
          <InventoryAlert items={lowStockItems} />
        </div>
      )}

      <div className="animate-fade-in-up animation-delay-400">
        <TodayAppointments appointments={todayAppointments} lastVisitMap={lastVisitMap} />
      </div>

      <div className="animate-fade-in-up animation-delay-500">
        <BirthdayCustomers customers={birthdayCustomers} currentMonth={currentMonth} />
      </div>
    </div>
  );
}
