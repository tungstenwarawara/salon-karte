import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { PageHeader } from "@/components/layout/page-header";
import type { Database } from "@/types/database";
import { VisitAnalytics } from "@/components/customers/visit-analytics";
import { CustomerBasicInfo } from "@/components/customers/customer-basic-info";
import { CustomerLineSection } from "@/components/customers/customer-line-section";
import { CustomerDetailContent } from "@/components/customers/customer-detail-content";

type CounselingSheet = Database["public"]["Tables"]["counseling_sheets"]["Row"];

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

  const [recordsResult, appointmentResult, purchasesResult, courseTicketsResult, counselingResult, lineLinkResult] = await Promise.all([
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
      .select("id, item_name, purchase_date, unit_price, quantity, total_price, memo, product_id")
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
    supabase
      .from("counseling_sheets")
      .select("id, salon_id, customer_id, token, status, responses, submitted_at, expires_at, created_at, updated_at")
      .eq("customer_id", id)
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false })
      .returns<CounselingSheet[]>(),
    supabase
      .from("customer_line_links")
      .select("id, display_name, is_following, linked_at")
      .eq("customer_id", id)
      .eq("salon_id", salon.id)
      .maybeSingle(),
  ]);

  const records = recordsResult.data ?? [];
  const nextAppointment = appointmentResult.data;
  const purchases = purchasesResult.data ?? [];
  const courseTickets = courseTicketsResult.data ?? [];
  const counselingSheets = counselingResult.data ?? [];
  const lineLink = lineLinkResult.data;

  // 写真一括ダウンロードボタンの表示判定（head: true でデータ転送ゼロ）
  const recordIds = records.map((r) => r.id);
  let hasPhotos = false;
  if (recordIds.length > 0) {
    const { count } = await supabase
      .from("treatment_photos")
      .select("id", { count: "exact", head: true })
      .in("treatment_record_id", recordIds);
    hasPhotos = (count ?? 0) > 0;
  }

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

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title={`${customer.last_name} ${customer.first_name}`}
          breadcrumbs={[
            { label: "顧客一覧", href: "/customers" },
            { label: `${customer.last_name} ${customer.first_name}` },
          ]}
        >
          <Link href={`/customers/${id}/edit`} className="text-sm text-accent hover:underline min-h-[44px] flex items-center">
            編集
          </Link>
        </PageHeader>
        {(customer.last_name_kana || customer.first_name_kana) && (
          <p className="text-sm text-text-light -mt-2">
            {customer.last_name_kana} {customer.first_name_kana}
          </p>
        )}
      </div>

      <VisitAnalytics
        customerId={id}
        visitCount={visitCount}
        daysSinceLastVisit={daysSinceLastVisit}
        avgInterval={avgInterval}
        nextAppointment={nextAppointment}
      />

      <CustomerBasicInfo customer={customer} customerId={id} />

      <CustomerLineSection lineLink={lineLink} />

      <CustomerDetailContent
        customerId={id}
        salonId={salon.id}
        customerName={`${customer.last_name}${customer.first_name}`}
        records={records}
        hasPhotos={hasPhotos}
        courseTickets={courseTickets}
        purchases={purchases}
        purchaseTotal={purchaseTotal}
        counselingSheets={counselingSheets}
      />
    </div>
  );
}
