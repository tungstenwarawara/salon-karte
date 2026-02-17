import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

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
  const today = new Date().toISOString().split("T")[0];
  const { data: nextAppointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("customer_id", id)
    .eq("status", "scheduled")
    .gte("appointment_date", today)
    .order("appointment_date", { ascending: true })
    .limit(1)
    .single<Appointment>();

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

      {/* Basic info */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-text-light">基本情報</h3>
        <InfoRow label="電話番号" value={customer.phone} />
        <InfoRow label="メール" value={customer.email} />
        <InfoRow label="生年月日" value={customer.birth_date} />
        <InfoRow label="肌質" value={customer.skin_type} />
        <InfoRow label="アレルギー" value={customer.allergies} />
        <InfoRow label="メモ" value={customer.notes} />
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
