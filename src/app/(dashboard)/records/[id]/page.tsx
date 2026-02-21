import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { formatDateJa } from "@/lib/format";
import { BeforeAfterComparison } from "@/components/records/before-after";
import type { Database } from "@/types/database";

type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type TreatmentPhoto = Database["public"]["Tables"]["treatment_photos"]["Row"];
type TreatmentRecordMenu = Database["public"]["Tables"]["treatment_record_menus"]["Row"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
type CourseTicket = Database["public"]["Tables"]["course_tickets"]["Row"];

type RecordWithCustomer = TreatmentRecord & {
  customers: { id: string; last_name: string; first_name: string } | null;
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: "現金",
  credit: "クレジット",
  ticket: "回数券",
  service: "サービス",
};

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  // P9: record, photos, record_menus, purchases, tickets を並列取得
  const [recordRes, photosRes, recordMenusRes, purchasesRes, ticketsRes] = await Promise.all([
    supabase
      .from("treatment_records")
      .select("id, treatment_date, menu_name_snapshot, treatment_area, products_used, skin_condition_before, notes_after, conversation_notes, caution_notes, next_visit_memo, customer_id, customers(id, last_name, first_name)")
      .eq("id", id)
      .eq("salon_id", salon.id)
      .single<RecordWithCustomer>(),
    supabase
      .from("treatment_photos")
      .select("id, treatment_record_id, storage_path, photo_type, description")
      .eq("treatment_record_id", id)
      .order("photo_type")
      .returns<TreatmentPhoto[]>(),
    supabase
      .from("treatment_record_menus")
      .select("id, menu_name_snapshot, duration_minutes_snapshot, price_snapshot, payment_type")
      .eq("treatment_record_id", id)
      .order("sort_order")
      .returns<TreatmentRecordMenu[]>(),
    supabase
      .from("purchases")
      .select("id, item_name, quantity, unit_price, total_price")
      .eq("treatment_record_id", id)
      .order("created_at")
      .returns<Purchase[]>(),
    supabase
      .from("course_tickets")
      .select("id, ticket_name, total_sessions, price")
      .eq("treatment_record_id", id)
      .order("created_at")
      .returns<CourseTicket[]>(),
  ]);

  const record = recordRes.data;
  if (!record) notFound();

  const customer = record.customers;
  const photos = photosRes.data;
  const recordMenus = recordMenusRes.data ?? [];
  const linkedPurchases = purchasesRes.data ?? [];
  const linkedTickets = ticketsRes.data ?? [];

  // メニュー名の表示用: 中間テーブルがあればそちらを優先、なければ旧menu_name_snapshot
  const menuDisplay = recordMenus.length > 0
    ? recordMenus.map((rm) => rm.menu_name_snapshot).join("、")
    : record.menu_name_snapshot ?? "施術記録";

  return (
    <div className="space-y-6">
      {/* Back link */}
      {customer && (
        <Link
          href={`/customers/${customer.id}`}
          className="flex items-center gap-1 text-sm text-accent hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          {customer.last_name} {customer.first_name}
        </Link>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{menuDisplay}</h2>
          <p className="text-sm text-text-light mt-1">
            {formatDateJa(record.treatment_date)}
          </p>
        </div>
        <Link
          href={`/records/${id}/edit`}
          className="text-sm text-accent hover:underline"
        >
          編集
        </Link>
      </div>

      {/* Customer link */}
      {customer && (
        <Link
          href={`/customers/${customer.id}`}
          className="block bg-surface border border-border rounded-xl p-3 hover:border-accent transition-colors"
        >
          <span className="text-sm text-text-light">顧客:</span>
          <span className="font-medium ml-2">
            {customer.last_name} {customer.first_name}
          </span>
        </Link>
      )}

      {/* 施術メニュー一覧（複数メニューがある場合） */}
      {recordMenus.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-bold mb-2">施術メニュー</h3>
          {recordMenus.map((rm) => (
            <div key={rm.id} className="flex items-center justify-between py-1.5">
              <div className="flex-1">
                <span className="text-sm">{rm.menu_name_snapshot}</span>
                {rm.duration_minutes_snapshot && (
                  <span className="text-xs text-text-light ml-2">{rm.duration_minutes_snapshot}分</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {rm.price_snapshot != null && (
                  <span className="text-sm">{rm.price_snapshot.toLocaleString()}円</span>
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  rm.payment_type === "ticket" ? "bg-blue-100 text-blue-700" :
                  rm.payment_type === "service" ? "bg-green-100 text-green-700" :
                  rm.payment_type === "credit" ? "bg-purple-100 text-purple-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {PAYMENT_TYPE_LABELS[rm.payment_type] ?? rm.payment_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record details */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <DetailRow label="施術部位" value={record.treatment_area} />
        <DetailRow label="使用化粧品・機器" value={record.products_used} />
        <DetailRow label="施術前の状態" value={record.skin_condition_before} />
        <DetailRow label="施術後の経過" value={record.notes_after} />
        <DetailRow label="話した内容" value={record.conversation_notes} />
        <DetailRow label="注意事項" value={record.caution_notes} />
        <DetailRow label="次回への申し送り" value={record.next_visit_memo} />
      </div>

      {/* Phase 6-2: 紐づく回数券購入 */}
      {linkedTickets.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-bold mb-2">回数券販売</h3>
          {linkedTickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between py-1.5">
              <div className="flex-1">
                <span className="text-sm">{ticket.ticket_name}</span>
                <span className="text-xs text-text-light ml-2">{ticket.total_sessions}回</span>
              </div>
              {ticket.price != null && (
                <span className="text-sm font-medium">{ticket.price.toLocaleString()}円</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Phase 6-2: 紐づく物販記録 */}
      {linkedPurchases.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-bold mb-2">物販記録</h3>
          {linkedPurchases.map((purchase) => (
            <div key={purchase.id} className="flex items-center justify-between py-1.5">
              <div className="flex-1">
                <span className="text-sm">{purchase.item_name}</span>
                <span className="text-xs text-text-light ml-2">
                  {purchase.quantity}個 × {purchase.unit_price.toLocaleString()}円
                </span>
              </div>
              <span className="text-sm font-medium">{purchase.total_price.toLocaleString()}円</span>
            </div>
          ))}
          {linkedPurchases.length > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-text-light">合計</span>
              <span className="text-sm font-bold text-accent">
                {linkedPurchases.reduce((s, p) => s + p.total_price, 0).toLocaleString()}円
              </span>
            </div>
          )}
        </div>
      )}

      {/* Photos - Before/After comparison */}
      {photos && photos.length > 0 && (
        <BeforeAfterComparison photos={photos} />
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium text-text-light mb-1">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}
