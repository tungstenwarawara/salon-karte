import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Database } from "@/types/database";
import { CourseTicketSection } from "@/components/customers/course-ticket-section";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single<Customer>();

  if (!customer) notFound();

  // 施術記録を取得
  const { data: records } = await supabase
    .from("treatment_records")
    .select("*")
    .eq("customer_id", id)
    .order("treatment_date", { ascending: false })
    .returns<TreatmentRecord[]>();

  // 来店分析
  const visitCount = records?.length ?? 0;
  const lastVisitDate = records?.[0]?.treatment_date ?? null;
  const daysSinceLastVisit = lastVisitDate
    ? Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // 来店間隔の計算
  let avgInterval: number | null = null;
  if (records && records.length >= 2) {
    const dates = records.map((r) => new Date(r.treatment_date).getTime()).sort((a, b) => a - b);
    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
      totalDays += (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    }
    avgInterval = Math.round(totalDays / (dates.length - 1));
  }

  // 次回予約を取得
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const { data: nextAppointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("customer_id", id)
    .eq("status", "scheduled")
    .gte("appointment_date", today)
    .order("appointment_date", { ascending: true })
    .limit(1)
    .single<Appointment>();

  // 購入履歴を取得
  const { data: purchases } = await supabase
    .from("purchases")
    .select("*")
    .eq("customer_id", id)
    .order("purchase_date", { ascending: false })
    .returns<Purchase[]>();

  const purchaseTotal = purchases?.reduce((sum, p) => sum + p.total_price, 0) ?? 0;

  // コースチケットを取得
  const { data: courseTickets } = await supabase
    .from("course_tickets")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .returns<CourseTicket[]>();

  // 施術合計を取得（appointment_menus経由）
  const { data: appointmentMenusData } = await supabase
    .from("appointments")
    .select("appointment_menus(price_snapshot)")
    .eq("customer_id", id);

  const treatmentTotal = appointmentMenusData?.reduce((sum, apt) => {
    const menus = (apt.appointment_menus ?? []) as { price_snapshot: number | null }[];
    return sum + menus.reduce((mSum, m) => mSum + (m.price_snapshot ?? 0), 0);
  }, 0) ?? 0;

  // 回数券合計
  const courseTicketTotal = courseTickets?.reduce((sum, t) => sum + (t.price ?? 0), 0) ?? 0;

  // 総合計
  const grandTotal = treatmentTotal + purchaseTotal + courseTicketTotal;

  // 年齢計算
  const age = customer.birth_date ? calculateAge(customer.birth_date) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <Link
          href={`/customers/${id}/edit`}
          className="text-sm text-accent hover:underline"
        >
          編集
        </Link>
      </div>

      {/* Visit analytics */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-text-light">来店分析</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-accent">{visitCount}</p>
            <p className="text-xs text-text-light">来店回数</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {daysSinceLastVisit !== null ? daysSinceLastVisit : "-"}
            </p>
            <p className="text-xs text-text-light">
              {daysSinceLastVisit !== null ? "日前に来店" : "未来店"}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {avgInterval !== null ? `${avgInterval}` : "-"}
            </p>
            <p className="text-xs text-text-light">
              {avgInterval !== null ? "日（平均間隔）" : "平均間隔"}
            </p>
          </div>
        </div>
        {daysSinceLastVisit !== null && daysSinceLastVisit >= 60 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
            {daysSinceLastVisit >= 90
              ? "90日以上ご来店がありません。フォローの連絡をおすすめします。"
              : "60日以上ご来店がありません。"}
          </div>
        )}
        {nextAppointment && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            次回予約: {nextAppointment.appointment_date}{" "}
            {(nextAppointment.start_time as string).slice(0, 5)}
            {nextAppointment.menu_name_snapshot && ` / ${nextAppointment.menu_name_snapshot}`}
          </div>
        )}
        {!nextAppointment && visitCount > 0 && (
          <Link
            href={`/appointments/new?customer=${id}`}
            className="block text-center text-sm text-accent hover:underline"
          >
            次回予約を登録する
          </Link>
        )}
      </div>

      {/* Sales summary */}
      {grandTotal > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-text-light">売上サマリー</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-light">施術合計</span>
              <span>{treatmentTotal.toLocaleString()}円</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-light">物販合計</span>
              <span>{purchaseTotal.toLocaleString()}円</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-light">回数券合計</span>
              <span>{courseTicketTotal.toLocaleString()}円</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
              <span>総合計</span>
              <span className="text-accent">{grandTotal.toLocaleString()}円</span>
            </div>
          </div>
        </div>
      )}

      {/* Basic info */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-text-light">基本情報</h3>
        <InfoRow label="電話番号" value={customer.phone} />
        <InfoRow label="メール" value={customer.email} />
        <InfoRow
          label="生年月日"
          value={
            customer.birth_date
              ? age !== null
                ? `${customer.birth_date}（${age}歳）`
                : customer.birth_date
              : null
          }
        />
        <InfoRow label="住所" value={customer.address} />
        <InfoRow label="婚姻状況" value={customer.marital_status} />
        <InfoRow
          label="お子様"
          value={
            customer.has_children === null
              ? null
              : customer.has_children
                ? "あり"
                : "なし"
          }
        />
        <InfoRow
          label="DM送付"
          value={
            customer.dm_allowed === null
              ? null
              : customer.dm_allowed
                ? "可"
                : "不可"
          }
        />
      </div>

      {/* Treatment related info */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-text-light">施術関連情報</h3>
        <InfoRow
          label="身長"
          value={customer.height_cm !== null ? `${customer.height_cm} cm` : null}
        />
        <InfoRow
          label="体重"
          value={customer.weight_kg !== null ? `${customer.weight_kg} kg` : null}
        />
        <InfoRow label="アレルギー" value={customer.allergies} />
        <InfoRow label="最終目標" value={customer.treatment_goal} />
        <InfoRow label="メモ" value={customer.notes} />
      </div>

      {/* Course tickets */}
      <CourseTicketSection
        customerId={id}
        initialTickets={courseTickets ?? []}
      />

      {/* Purchase history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">
            物販購入履歴
            {purchaseTotal > 0 && (
              <span className="text-sm font-normal text-text-light ml-2">
                合計 {purchaseTotal.toLocaleString()}円
              </span>
            )}
          </h3>
          <Link
            href={`/customers/${id}/purchases/new`}
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[40px] flex items-center"
          >
            + 購入記録
          </Link>
        </div>

        {purchases && purchases.length > 0 ? (
          <div className="space-y-2">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-surface border border-border rounded-xl p-3"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">
                    {purchase.item_name}
                  </span>
                  <span className="text-sm text-text-light">
                    {purchase.purchase_date}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-text-light">
                    {purchase.unit_price.toLocaleString()}円 x{" "}
                    {purchase.quantity}
                  </span>
                  <span className="text-sm font-medium">
                    {purchase.total_price.toLocaleString()}円
                  </span>
                </div>
                {purchase.memo && (
                  <p className="text-xs text-text-light mt-1">
                    {purchase.memo}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
            購入記録はまだありません
          </div>
        )}
      </div>

      {/* Treatment records */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">施術履歴</h3>
          <Link
            href={`/records/new?customer=${id}`}
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[40px] flex items-center"
          >
            + カルテ作成
          </Link>
        </div>

        {records && records.length > 0 ? (
          <div className="space-y-2">
            {records.map((record) => (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="block bg-surface border border-border rounded-xl p-3 hover:border-accent transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {record.menu_name_snapshot ?? "施術記録"}
                  </span>
                  <span className="text-sm text-text-light">
                    {record.treatment_date}
                  </span>
                </div>
                {record.next_visit_memo && (
                  <p className="text-sm text-text-light mt-1 truncate">
                    次回: {record.next_visit_memo}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
            施術記録はまだありません
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex">
      <span className="text-sm text-text-light w-24 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
