import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { PageHeader } from "@/components/layout/page-header";
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
  staff: { name: string } | null;
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: "現金",
  credit: "クレジット",
  ticket: "回数券",
  service: "サービス",
};

const RECORD_TYPE_BADGE: Record<TreatmentRecord["record_type"], { label: string; className: string }> = {
  visit: { label: "来店", className: "bg-accent/10 text-accent" },
  product_only: { label: "物販のみ", className: "bg-blue-50 text-blue-700" },
  cancelled: { label: "キャンセル", className: "bg-red-50 text-red-700" },
  memo: { label: "メモ", className: "bg-gray-100 text-gray-700" },
};

const PAGE_TITLE: Record<TreatmentRecord["record_type"], string> = {
  visit: "カルテ詳細",
  product_only: "物販のみ記録",
  cancelled: "キャンセル記録",
  memo: "メモ",
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

  // record, photos, record_menus, purchases, tickets, linked appointment を並列取得
  const [recordRes, photosRes, recordMenusRes, purchasesRes, ticketsRes, appointmentRes] = await Promise.all([
    supabase
      .from("treatment_records")
      .select("id, treatment_date, menu_name_snapshot, treatment_area, products_used, skin_condition_before, notes_after, conversation_notes, caution_notes, next_visit_memo, customer_id, staff_id, record_type, appointment_id, customers(id, last_name, first_name), staff(name)")
      .eq("id", id)
      .eq("salon_id", salon.id)
      .single<RecordWithCustomer>(),
    supabase
      .from("treatment_photos")
      .select("id, treatment_record_id, storage_path, photo_type, memo, sort_order, created_at")
      .eq("treatment_record_id", id)
      .order("photo_type")
      .order("sort_order")
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
      .eq("salon_id", salon.id)
      .order("created_at")
      .returns<Purchase[]>(),
    supabase
      .from("course_tickets")
      .select("id, ticket_name, total_sessions, price")
      .eq("treatment_record_id", id)
      .eq("salon_id", salon.id)
      .order("created_at")
      .returns<CourseTicket[]>(),
    supabase
      .from("appointments")
      .select("id, appointment_date, start_time")
      .eq("treatment_record_id", id)
      .eq("salon_id", salon.id)
      .limit(1)
      .returns<{ id: string; appointment_date: string; start_time: string }[]>(),
  ]);

  const record = recordRes.data;
  if (!record) notFound();

  const customer = record.customers;
  const photos = photosRes.data ?? [];
  const recordMenus = recordMenusRes.data ?? [];
  const recordType = record.record_type;
  const badge = RECORD_TYPE_BADGE[recordType];
  const pageTitle = PAGE_TITLE[recordType];

  // キャンセル種別の場合、appointment_id 経由で予約を取得（visit は treatment_record_id 経由で既に取得済み）
  let cancelledLinkedAppointment: { id: string; appointment_date: string; start_time: string } | null = null;
  if (recordType === "cancelled" && record.appointment_id) {
    const { data: cancelledApt } = await supabase
      .from("appointments")
      .select("id, appointment_date, start_time")
      .eq("id", record.appointment_id)
      .eq("salon_id", salon.id)
      .maybeSingle<{ id: string; appointment_date: string; start_time: string }>();
    cancelledLinkedAppointment = cancelledApt;
  }

  // 写真のSigned URLをサーバー側で一括取得（クライアント側useEffectを排除 → INP改善）
  const photoUrlMap: Record<string, string> = {};
  if (photos.length > 0) {
    const paths = photos.map((p) => p.storage_path);
    const { data: signedUrls } = await supabase.storage
      .from("treatment-photos")
      .createSignedUrls(paths, 3600);
    if (signedUrls) {
      for (const item of signedUrls) {
        if (item.signedUrl && item.path) {
          photoUrlMap[item.path] = item.signedUrl;
        }
      }
    }
  }
  const linkedPurchases = purchasesRes.data ?? [];
  const linkedTickets = ticketsRes.data ?? [];
  const linkedAppointment = appointmentRes.data?.[0] ?? null;

  // メニュー名の表示用: 中間テーブルがあればそちらを優先、なければ旧menu_name_snapshot
  const menuDisplay = recordMenus.length > 0
    ? recordMenus.map((rm) => rm.menu_name_snapshot).join("、")
    : record.menu_name_snapshot ?? "施術記録";

  // 施術メニュー合計金額
  const menuTotal = recordMenus.reduce((s, rm) => s + (rm.price_snapshot ?? 0), 0);
  const menuTotalDuration = recordMenus.reduce((s, rm) => s + (rm.duration_minutes_snapshot ?? 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={pageTitle}
        breadcrumbs={
          customer
            ? [
                { label: `${customer.last_name} ${customer.first_name}`, href: `/customers/${customer.id}` },
                { label: pageTitle },
              ]
            : [{ label: pageTitle }]
        }
      >
        <div className="flex items-center gap-3">
          {recordType === "visit" && (
            <a
              href={`/records/${id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline min-h-[44px] flex items-center"
            >
              PDF
            </a>
          )}
          <Link
            href={`/records/${id}/edit`}
            className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center"
          >
            編集
          </Link>
        </div>
      </PageHeader>

      {/* ヘッダーカード: 種別バッジ・日付・顧客 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium rounded-md px-2 py-0.5 ${badge.className}`}>{badge.label}</span>
            <p className="text-lg font-bold">{formatDateJa(record.treatment_date)}</p>
          </div>
          {(linkedAppointment || cancelledLinkedAppointment) && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg shrink-0">
              予約 {(linkedAppointment ?? cancelledLinkedAppointment)!.start_time.slice(0, 5)}〜
            </span>
          )}
        </div>
        {customer && (
          <Link
            href={`/customers/${customer.id}`}
            className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
          >
            <span className="text-text-light">顧客</span>
            <span className="font-medium">{customer.last_name} {customer.first_name}</span>
          </Link>
        )}
        {recordType === "visit" && record.staff && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-light">担当</span>
            <span className="font-medium">{record.staff.name}</span>
          </div>
        )}
        {recordType === "visit" && (
          <p className="text-sm font-medium text-text-light">{menuDisplay}</p>
        )}
      </div>

      {/* キャンセル理由 */}
      {recordType === "cancelled" && (
        <div className="space-y-2">
          <h3 className="font-bold">キャンセル理由</h3>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {record.notes_after || <span className="text-text-light">（記載なし）</span>}
            </p>
          </div>
          <p className="text-xs text-text-light">来店分析にはカウントされません</p>
        </div>
      )}

      {/* メモ本文 */}
      {recordType === "memo" && (
        <div className="space-y-2">
          <h3 className="font-bold">メモ</h3>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {record.notes_after || <span className="text-text-light">（記載なし）</span>}
            </p>
          </div>
          <p className="text-xs text-text-light">来店分析にはカウントされません</p>
        </div>
      )}

      {/* 施術メニュー一覧（visit のみ） */}
      {recordType === "visit" && recordMenus.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">施術メニュー</h3>
          {recordMenus.map((rm) => (
            <div key={rm.id} className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{rm.menu_name_snapshot}</p>
                {rm.duration_minutes_snapshot != null && (
                  <p className="text-xs text-text-light mt-0.5">{rm.duration_minutes_snapshot}分</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  rm.payment_type === "ticket" ? "bg-blue-50 text-blue-700" :
                  rm.payment_type === "service" ? "bg-green-50 text-green-700" :
                  rm.payment_type === "credit" ? "bg-purple-50 text-purple-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {PAYMENT_TYPE_LABELS[rm.payment_type] ?? rm.payment_type}
                </span>
                {rm.price_snapshot != null && (
                  <span className="text-sm font-bold tabular-nums">{rm.price_snapshot.toLocaleString()}円</span>
                )}
              </div>
            </div>
          ))}
          {recordMenus.length > 1 && (
            <div className="flex items-center justify-between px-3 pt-1">
              <span className="text-xs text-text-light">合計 {menuTotalDuration}分</span>
              <span className="text-sm font-bold text-accent">{menuTotal.toLocaleString()}円</span>
            </div>
          )}
        </div>
      )}

      {/* 施術メモ（visit のみ） */}
      {recordType === "visit" && (
        <DetailSection
          items={[
            { label: "施術部位", value: record.treatment_area },
            { label: "使用化粧品・機器", value: record.products_used },
            { label: "施術前の状態", value: record.skin_condition_before },
            { label: "施術後の経過", value: record.notes_after },
            { label: "話した内容", value: record.conversation_notes },
            { label: "注意事項", value: record.caution_notes, highlight: true },
            { label: "次回への申し送り", value: record.next_visit_memo, highlight: true },
          ]}
        />
      )}

      {/* 回数券販売（visit のみ） */}
      {recordType === "visit" && linkedTickets.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">回数券販売</h3>
          {linkedTickets.map((ticket) => (
            <div key={ticket.id} className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{ticket.ticket_name}</p>
                <p className="text-xs text-text-light mt-0.5">{ticket.total_sessions}回</p>
              </div>
              {ticket.price != null && (
                <span className="text-sm font-bold tabular-nums">{ticket.price.toLocaleString()}円</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 物販記録（visit / product_only で表示） */}
      {(recordType === "visit" || recordType === "product_only") && linkedPurchases.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">物販記録</h3>
          {linkedPurchases.map((purchase) => (
            <div key={purchase.id} className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{purchase.item_name}</p>
                <p className="text-xs text-text-light mt-0.5">{purchase.quantity}個 × {purchase.unit_price.toLocaleString()}円</p>
              </div>
              <span className="text-sm font-bold tabular-nums">{purchase.total_price.toLocaleString()}円</span>
            </div>
          ))}
          {linkedPurchases.length > 1 && (
            <div className="flex items-center justify-between px-3 pt-1">
              <span className="text-xs text-text-light">合計</span>
              <span className="text-sm font-bold text-accent">
                {linkedPurchases.reduce((s, p) => s + p.total_price, 0).toLocaleString()}円
              </span>
            </div>
          )}
        </div>
      )}

      {/* 写真（visit のみ） */}
      {recordType === "visit" && photos.length > 0 && (
        <BeforeAfterComparison photos={photos} serverUrlMap={photoUrlMap} />
      )}
    </div>
  );
}

type DetailItem = { label: string; value: string | null; highlight?: boolean };

function DetailSection({ items }: { items: DetailItem[] }) {
  const filled = items.filter((item) => item.value);
  if (filled.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-bold">施術メモ</h3>
      <div className="bg-surface border border-border rounded-2xl divide-y divide-border">
        {filled.map((item) => (
          <div key={item.label} className={`px-4 py-3 ${item.highlight ? "bg-accent/5" : ""}`}>
            <p className="text-xs font-bold text-text-light mb-1">{item.label}</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
