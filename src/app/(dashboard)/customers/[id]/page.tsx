import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import type { Database } from "@/types/database";
import { VisitAnalytics } from "@/components/customers/visit-analytics";
import { SalesSummary } from "@/components/customers/sales-summary";
import { CustomerBasicInfo } from "@/components/customers/customer-basic-info";
import { PurchaseHistory } from "@/components/customers/purchase-history";
import { TreatmentHistory } from "@/components/customers/treatment-history";
import { CourseTicketSection } from "@/components/customers/course-ticket-section";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type TreatmentRecordMenu = Database["public"]["Tables"]["treatment_record_menus"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];

type RecordWithMenus = TreatmentRecord & {
  treatment_record_menus: TreatmentRecordMenu[];
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  const { data: customer } = await supabase
    .from("customers")
    .select("id, salon_id, last_name, first_name, last_name_kana, first_name_kana, phone, email, birth_date, address, marital_status, has_children, dm_allowed, height_cm, weight_kg, allergies, treatment_goal, notes")
    .eq("id", id)
    .eq("salon_id", salon.id)
    .single<Customer>();

  if (!customer) notFound();

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [recordsResult, appointmentResult, purchasesResult, courseTicketsResult] = await Promise.all([
    supabase
      .from("treatment_records")
      .select("id, treatment_date, menu_name_snapshot, skin_condition_before, customer_id, treatment_record_menus(id, menu_name_snapshot, price_snapshot, payment_type, ticket_id)")
      .eq("customer_id", id)
      .eq("salon_id", salon.id)
      .order("treatment_date", { ascending: false })
      .returns<RecordWithMenus[]>(),
    supabase
      .from("appointments")
      .select("id, appointment_date, start_time, menu_name_snapshot, status")
      .eq("customer_id", id)
      .eq("salon_id", salon.id)
      .eq("status", "scheduled")
      .gte("appointment_date", today)
      .order("appointment_date", { ascending: true })
      .limit(1)
      .maybeSingle<Appointment>(),
    supabase
      .from("purchases")
      .select("id, item_name, purchase_date, unit_price, quantity, total_price, memo")
      .eq("customer_id", id)
      .eq("salon_id", salon.id)
      .order("purchase_date", { ascending: false })
      .returns<Purchase[]>(),
    supabase
      .from("course_tickets")
      .select("id, ticket_name, total_sessions, used_sessions, price, status, expiry_date, created_at, memo, customer_id")
      .eq("customer_id", id)
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false })
      .returns<CourseTicket[]>(),
  ]);

  const records = recordsResult.data ?? [];
  const nextAppointment = appointmentResult.data;
  const purchases = purchasesResult.data ?? [];
  const courseTickets = courseTicketsResult.data ?? [];

  // 来店分析
  const visitCount = records.length;
  const lastVisitDate = records[0]?.treatment_date ?? null;
  const daysSinceLastVisit = lastVisitDate
    ? Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let avgInterval: number | null = null;
  if (records.length >= 2) {
    const dates = records.map((r) => new Date(r.treatment_date).getTime()).sort((a, b) => a - b);
    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
      totalDays += (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    }
    avgInterval = Math.round(totalDays / (dates.length - 1));
  }

  const purchaseTotal = purchases.reduce((sum, p) => sum + p.total_price, 0);

  // 施術合計: cash/credit のみ集計
  const treatmentTotal = records.reduce((sum, rec) => {
    const menus = rec.treatment_record_menus ?? [];
    return sum + menus
      .filter((m) => m.payment_type === "cash" || m.payment_type === "credit")
      .reduce((mSum, m) => mSum + (m.price_snapshot ?? 0), 0);
  }, 0);

  const courseTicketTotal = courseTickets.reduce((sum, t) => sum + (t.price ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* 戻るリンク */}
      <Link
        href="/customers"
        className="flex items-center gap-1 text-sm text-accent hover:underline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        顧客一覧
      </Link>

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {customer.last_name} {customer.first_name}
          </h2>
          {(customer.last_name_kana || customer.first_name_kana) && (
            <p className="text-sm text-text-light">
              {customer.last_name_kana} {customer.first_name_kana}
            </p>
          )}
        </div>
        <Link href={`/customers/${id}/edit`} className="text-sm text-accent hover:underline">
          編集
        </Link>
      </div>

      <VisitAnalytics
        customerId={id}
        visitCount={visitCount}
        daysSinceLastVisit={daysSinceLastVisit}
        avgInterval={avgInterval}
        nextAppointment={nextAppointment}
      />

      <SalesSummary
        treatmentTotal={treatmentTotal}
        purchaseTotal={purchaseTotal}
        courseTicketTotal={courseTicketTotal}
      />

      <CustomerBasicInfo customer={customer} customerId={id} />

      <CourseTicketSection customerId={id} initialTickets={courseTickets} />

      <PurchaseHistory customerId={id} purchases={purchases} purchaseTotal={purchaseTotal} />

      <TreatmentHistory customerId={id} records={records} />
    </div>
  );
}
