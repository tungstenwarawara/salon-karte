import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateJa } from "@/lib/format";
import type { Database } from "@/types/database";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type AppointmentMenu = Database["public"]["Tables"]["appointment_menus"]["Row"];

type AppointmentWithCustomer = Appointment & {
  customers: { id: string; last_name: string; first_name: string } | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "予定", color: "bg-blue-100 text-blue-700" },
  completed: { label: "来店済", color: "bg-green-100 text-green-700" },
  cancelled: { label: "キャンセル", color: "bg-gray-100 text-gray-500" },
};

const SOURCE_LABELS: Record<string, string> = {
  direct: "直接予約",
  hotpepper: "ホットペッパー",
  phone: "電話",
  line: "LINE",
  other: "その他",
};

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  // 予約とメニューを並列取得
  const [appointmentRes, menusRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, customer_id, appointment_date, start_time, end_time, source, memo, status, menu_name_snapshot, treatment_record_id, customers(id, last_name, first_name)")
      .eq("id", id)
      .eq("salon_id", salon.id)
      .single<AppointmentWithCustomer>(),
    supabase
      .from("appointment_menus")
      .select("id, menu_name_snapshot, price_snapshot, duration_minutes_snapshot, sort_order")
      .eq("appointment_id", id)
      .order("sort_order")
      .returns<AppointmentMenu[]>(),
  ]);

  const appointment = appointmentRes.data;
  if (!appointment) notFound();

  const customer = appointment.customers;
  const menus = menusRes.data ?? [];
  const statusInfo = STATUS_LABELS[appointment.status] ?? STATUS_LABELS.scheduled;

  // メニュー名の表示
  const menuDisplay = menus.length > 0
    ? menus.map((m) => m.menu_name_snapshot).join("、")
    : appointment.menu_name_snapshot ?? "";

  // 合計金額・時間
  const totalPrice = menus.reduce((sum, m) => sum + (m.price_snapshot ?? 0), 0);
  const totalDuration = menus.reduce((sum, m) => sum + (m.duration_minutes_snapshot ?? 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="予約詳細"
        breadcrumbs={[
          { label: "予約管理", href: "/appointments" },
          { label: "予約詳細" },
        ]}
      >
        {appointment.status === "scheduled" && (
          <Link
            href={`/appointments/${id}/edit`}
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center"
          >
            編集
          </Link>
        )}
      </PageHeader>

      {/* ステータス + 日時 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          {appointment.source && (
            <span className="text-sm text-text-light">
              {SOURCE_LABELS[appointment.source] ?? appointment.source}
            </span>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-text-light mb-1">日時</p>
          <p className="font-bold text-lg">
            {formatDateJa(appointment.appointment_date)}
          </p>
          <p className="text-sm mt-0.5">
            {formatTime(appointment.start_time)}
            {appointment.end_time ? ` 〜 ${formatTime(appointment.end_time)}` : ""}
          </p>
        </div>
      </div>

      {/* 顧客 */}
      {customer && (
        <Link
          href={`/customers/${customer.id}`}
          className="block bg-surface border border-border rounded-2xl p-5 hover:border-accent transition-colors"
        >
          <p className="text-sm font-medium text-text-light mb-1">顧客</p>
          <p className="font-bold">{customer.last_name} {customer.first_name}</p>
        </Link>
      )}

      {/* メニュー */}
      {menus.length > 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-text-light">施術メニュー</h3>
          {menus.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-1.5">
              <div className="flex-1">
                <span className="text-sm">{m.menu_name_snapshot}</span>
                {m.duration_minutes_snapshot != null && (
                  <span className="text-xs text-text-light ml-2">{m.duration_minutes_snapshot}分</span>
                )}
              </div>
              {m.price_snapshot != null && (
                <span className="text-sm">{m.price_snapshot.toLocaleString()}円</span>
              )}
            </div>
          ))}
          {menus.length > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-text-light">
                合計 {totalDuration > 0 ? `${totalDuration}分` : ""}
              </span>
              {totalPrice > 0 && (
                <span className="text-sm font-bold text-accent">{totalPrice.toLocaleString()}円</span>
              )}
            </div>
          )}
        </div>
      ) : menuDisplay ? (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-sm font-medium text-text-light mb-1">メニュー</p>
          <p className="text-sm">{menuDisplay}</p>
        </div>
      ) : null}

      {/* メモ */}
      {appointment.memo && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-sm font-medium text-text-light mb-1">メモ</p>
          <p className="text-sm whitespace-pre-wrap">{appointment.memo}</p>
        </div>
      )}

      {/* アクション */}
      <div className="space-y-2 pt-2">
        {appointment.status === "scheduled" && (
          <Link
            href={`/records/new?customer=${appointment.customer_id}&appointment=${id}`}
            className="block w-full text-center bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors min-h-[48px]"
          >
            カルテを作成
          </Link>
        )}
        {appointment.status === "completed" && !appointment.treatment_record_id && (
          <Link
            href={`/records/new?customer=${appointment.customer_id}&appointment=${id}`}
            className="block w-full text-center bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors min-h-[48px]"
          >
            カルテを作成
          </Link>
        )}
        {appointment.status === "completed" && appointment.treatment_record_id && (
          <Link
            href={`/records/${appointment.treatment_record_id}`}
            className="block w-full text-center bg-accent/10 text-accent font-medium rounded-xl py-3 transition-colors min-h-[48px] hover:bg-accent/20"
          >
            カルテを見る
          </Link>
        )}
      </div>
    </div>
  );
}
