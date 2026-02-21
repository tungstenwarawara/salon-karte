import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import type { Database } from "@/types/database";
import { LapsedCustomersSection } from "@/components/dashboard/lapsed-customers-section";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { InventoryAlert } from "@/components/dashboard/inventory-alert";
import { TodayAppointments } from "@/components/dashboard/today-appointments";
import { BirthdayCustomers } from "@/components/dashboard/birthday-customers";
import { MonthlySales } from "@/components/dashboard/monthly-sales";
import { RecentRecords } from "@/components/dashboard/recent-records";
import { FeatureTip } from "@/components/dashboard/feature-tip";

type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "おはようございます";
  if (hour < 17) return "こんにちは";
  return "おつかれさまです";
}

export default async function DashboardPage() {
  const { user, salon, supabase } = await getAuthAndSalon();

  if (!user) {
    redirect("/login");
  }

  if (!salon) {
    redirect("/setup");
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

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
  type MonthlySalesRow = {
    month: number;
    treatment_sales: number;
    product_sales: number;
    ticket_sales: number;
  };

  // 全クエリを並列実行（11→8クエリに削減、在庫RPCも並列化）
  const [
    todayAppointmentsRes,
    customerCountRes,
    menuCountRes,
    lapsedCustomersRes,
    monthlySalesRes,
    birthdayRes,
    recentRecordsRes,
    inventoryRes,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, customer_id, start_time, status, menu_name_snapshot, customers(last_name, first_name)")
      .eq("salon_id", salon.id)
      .eq("appointment_date", today)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true })
      .returns<(Appointment & { customers: { last_name: string; first_name: string } | null })[]>(),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id),
    supabase
      .from("treatment_menus")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .eq("is_active", true),
    supabase
      .rpc("get_lapsed_customers", { p_salon_id: salon.id, p_days_threshold: 60 })
      .returns<LapsedCustomer[]>(),
    // 月間売上: 3クエリ（treatment_records+purchases+course_tickets）→ 1 RPCに統合
    supabase
      .rpc("get_monthly_sales_summary", { p_salon_id: salon.id, p_year: currentYear })
      .returns<MonthlySalesRow[]>(),
    supabase
      .from("customers")
      .select("id, last_name, first_name, birth_date")
      .eq("salon_id", salon.id)
      .like("birth_date", `%-${String(currentMonth).padStart(2, "0")}-%`),
    supabase
      .from("treatment_records")
      .select("id, treatment_date, menu_name_snapshot, customers(last_name, first_name)")
      .eq("salon_id", salon.id)
      .order("treatment_date", { ascending: false })
      .limit(3)
      .returns<(TreatmentRecord & { customers: { last_name: string; first_name: string } | null })[]>(),
    // 在庫アラート: Promise.allに統合（直列→並列に改善）
    supabase
      .rpc("get_inventory_summary", { p_salon_id: salon.id })
      .returns<InventoryAlertItem[]>(),
  ]);

  const todayAppointments = todayAppointmentsRes.data;
  const customerCount = customerCountRes.count;
  const menuCount = menuCountRes.count;
  const lapsedCustomers = lapsedCustomersRes.data as LapsedCustomer[] | null;
  const recentRecords = recentRecordsRes.data;

  // 在庫アラート: 在庫が発注点以下の商品を抽出
  const lowStockItems = (inventoryRes.data ?? []).filter(
    (item) => item.current_stock <= item.reorder_point
  );

  // 月間売上: RPCの今月分だけ抽出（3クエリ+JS集計 → 1 RPC結果のフィルタに簡素化）
  const monthData = (monthlySalesRes.data ?? []).find((m) => m.month === currentMonth);
  const monthlyTreatmentSales = monthData?.treatment_sales ?? 0;
  const monthlyProductSales = monthData?.product_sales ?? 0;
  const monthlyTicketSales = monthData?.ticket_sales ?? 0;

  // 誕生日（DBで月フィルタ済み → 日ソートのみ）
  const birthdayCustomers = (birthdayRes.data ?? [])
    .filter((c) => c.birth_date)
    .map((c) => ({
      ...c,
      birth_day: parseInt(c.birth_date!.split("-")[2], 10),
    }))
    .sort((a, b) => a.birth_day - b.birth_day);

  // 表示用の集計値
  const appointmentCount = todayAppointments?.filter((a) => a.status === "scheduled").length ?? 0;
  const lapsedCount = lapsedCustomers?.length ?? 0;

  // オンボーディング
  const hasBusinessHours = salon.business_hours !== null;
  const hasMenus = (menuCount ?? 0) > 0;
  const hasCustomers = (customerCount ?? 0) > 0;
  const setupSteps = [
    { done: hasBusinessHours, label: "営業時間を設定する", href: "/settings/business-hours" },
    { done: hasMenus, label: "施術メニューを登録する", href: "/settings/menus" },
    { done: hasCustomers, label: "最初のお客様を登録する", href: "/customers/new" },
  ];
  const allSetupDone = setupSteps.every((s) => s.done);
  const completedSteps = setupSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-5">
      {/* 挨拶 */}
      <div>
        <p className="text-text-light text-sm">{getGreeting()}</p>
        <h2 className="text-xl font-bold mt-0.5">{salon.name}</h2>
      </div>

      {!allSetupDone && (
        <OnboardingChecklist setupSteps={setupSteps} completedSteps={completedSteps} />
      )}

      <SummaryCards
        appointmentCount={appointmentCount}
        lapsedCount={lapsedCount}
        customerCount={customerCount ?? 0}
      />

      <QuickActions />

      <InventoryAlert items={lowStockItems} />

      <TodayAppointments appointments={todayAppointments} />

      <BirthdayCustomers customers={birthdayCustomers} currentMonth={currentMonth} />

      <MonthlySales
        treatmentSales={monthlyTreatmentSales}
        productSales={monthlyProductSales}
        ticketSales={monthlyTicketSales}
        year={now.getFullYear()}
        month={currentMonth}
      />

      {lapsedCustomers && lapsedCustomers.length > 0 && (
        <LapsedCustomersSection initialCustomers={lapsedCustomers} salonId={salon.id} />
      )}

      <RecentRecords records={recentRecords} />

      <FeatureTip allSetupDone={allSetupDone} lapsedCount={lapsedCount} />
    </div>
  );
}
