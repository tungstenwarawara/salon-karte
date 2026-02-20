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
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const currentMonth = now.getMonth() + 1;

  type LapsedCustomer = {
    id: string;
    last_name: string;
    first_name: string;
    last_visit_date: string;
    days_since: number;
  };

  // 全クエリを並列実行（レスポンス大幅改善）
  const [
    todayAppointmentsRes,
    customerCountRes,
    menuCountRes,
    lapsedCustomersRes,
    monthlyRecordsRes,
    monthlyPurchasesRes,
    monthlyTicketsRes,
    birthdayRes,
    recentRecordsRes,
    productCountRes,
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
      .rpc("get_lapsed_customers", {
        p_salon_id: salon.id,
        p_days_threshold: 60,
      })
      .returns<LapsedCustomer[]>(),
    supabase
      .from("treatment_records")
      .select("treatment_record_menus(price_snapshot, payment_type)")
      .eq("salon_id", salon.id)
      .gte("treatment_date", monthStart)
      .lt("treatment_date", monthEnd),
    supabase
      .from("purchases")
      .select("total_price")
      .eq("salon_id", salon.id)
      .gte("purchase_date", monthStart)
      .lt("purchase_date", monthEnd),
    supabase
      .from("course_tickets")
      .select("price")
      .eq("salon_id", salon.id)
      .gte("purchase_date", monthStart)
      .lt("purchase_date", monthEnd),
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
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .eq("is_active", true),
  ]);

  const todayAppointments = todayAppointmentsRes.data;
  const customerCount = customerCountRes.count;
  const menuCount = menuCountRes.count;
  const lapsedCustomers = lapsedCustomersRes.data as LapsedCustomer[] | null;
  const recentRecords = recentRecordsRes.data;
  const productCount = productCountRes.count ?? 0;

  // 在庫アラート: 商品がある場合のみクエリ（パフォーマンス保護）
  type InventoryAlertItem = {
    product_id: string;
    product_name: string;
    current_stock: number;
    reorder_point: number;
  };
  let lowStockItems: InventoryAlertItem[] = [];
  if (productCount > 0) {
    const { data: inventoryData } = await supabase.rpc("get_inventory_summary", {
      p_salon_id: salon.id,
    });
    if (inventoryData) {
      lowStockItems = (inventoryData as InventoryAlertItem[]).filter(
        (item) => item.current_stock <= item.reorder_point
      );
    }
  }

  // 売上集計
  const monthlyTreatmentSales = monthlyRecordsRes.data?.reduce((sum, rec) => {
    const menus = (rec.treatment_record_menus ?? []) as { price_snapshot: number | null; payment_type: string }[];
    return sum + menus
      .filter((m) => m.payment_type === "cash" || m.payment_type === "credit")
      .reduce((mSum, m) => mSum + (m.price_snapshot ?? 0), 0);
  }, 0) ?? 0;
  const monthlyProductSales = monthlyPurchasesRes.data?.reduce((sum, p) => sum + (p as { total_price: number }).total_price, 0) ?? 0;
  const monthlyTicketSales = monthlyTicketsRes.data?.reduce((sum, t) => sum + ((t as { price: number | null }).price ?? 0), 0) ?? 0;

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
        <LapsedCustomersSection initialCustomers={lapsedCustomers} />
      )}

      <RecentRecords records={recentRecords} />

      <FeatureTip allSetupDone={allSetupDone} lapsedCount={lapsedCount} />
    </div>
  );
}
