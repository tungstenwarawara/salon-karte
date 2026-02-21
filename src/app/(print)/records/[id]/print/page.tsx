import { notFound, redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { formatDateJa } from "@/lib/format";
import { PrintTrigger } from "@/components/records/print-trigger";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "現金", credit: "クレジット", ticket: "回数券", service: "サービス",
};

type RecordWithCustomer = {
  id: string;
  treatment_date: string;
  treatment_area: string | null;
  products_used: string | null;
  skin_condition_before: string | null;
  notes_after: string | null;
  conversation_notes: string | null;
  caution_notes: string | null;
  next_visit_memo: string | null;
  customers: { id: string; last_name: string; first_name: string } | null;
};

type RecordMenu = {
  id: string;
  menu_name_snapshot: string;
  duration_minutes_snapshot: number | null;
  price_snapshot: number | null;
  payment_type: string;
};

type Photo = { id: string; storage_path: string; photo_type: string; memo: string | null };
type Purchase = { id: string; item_name: string; quantity: number; unit_price: number; total_price: number };
type Ticket = { id: string; ticket_name: string; total_sessions: number; price: number | null };

export default async function KartePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  const [recordRes, menusRes, photosRes, purchasesRes, ticketsRes] = await Promise.all([
    supabase
      .from("treatment_records")
      .select("id, treatment_date, treatment_area, products_used, skin_condition_before, notes_after, conversation_notes, caution_notes, next_visit_memo, customer_id, customers(id, last_name, first_name)")
      .eq("id", id)
      .eq("salon_id", salon.id)
      .single<RecordWithCustomer>(),
    supabase
      .from("treatment_record_menus")
      .select("id, menu_name_snapshot, duration_minutes_snapshot, price_snapshot, payment_type")
      .eq("treatment_record_id", id)
      .order("sort_order")
      .returns<RecordMenu[]>(),
    supabase
      .from("treatment_photos")
      .select("id, storage_path, photo_type, memo")
      .eq("treatment_record_id", id)
      .order("photo_type")
      .returns<Photo[]>(),
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
      .returns<Ticket[]>(),
  ]);

  const record = recordRes.data;
  if (!record) notFound();

  const customer = record.customers;
  const menus = menusRes.data ?? [];
  const photos = photosRes.data ?? [];
  const purchases = purchasesRes.data ?? [];
  const tickets = ticketsRes.data ?? [];

  // 写真のSigned URLをサーバーサイドで取得
  const photoPaths = photos.map((p) => p.storage_path);
  const photoUrlMap = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from("treatment-photos")
      .createSignedUrls(photoPaths, 3600);
    if (signedData) {
      for (const item of signedData) {
        if (item.signedUrl && item.path) {
          photoUrlMap.set(item.path, item.signedUrl);
        }
      }
    }
  }

  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");

  const menuDisplay = menus.length > 0
    ? menus.map((m) => m.menu_name_snapshot).join("、")
    : "施術記録";

  const detailFields = [
    { label: "施術部位", value: record.treatment_area },
    { label: "使用化粧品・機器", value: record.products_used },
    { label: "施術前の状態", value: record.skin_condition_before },
    { label: "施術後の経過", value: record.notes_after },
    { label: "話した内容", value: record.conversation_notes },
    { label: "注意事項", value: record.caution_notes },
    { label: "次回への申し送り", value: record.next_visit_memo },
  ];

  return (
    <>
      <PrintTrigger backHref={`/records/${id}`} />

      <div className="max-w-[210mm] mx-auto px-8 py-6 print:px-0 print:py-0 print:max-w-none text-gray-900 text-sm leading-relaxed">
        {/* ヘッダー */}
        <div className="border-b-2 border-gray-800 pb-3 mb-4">
          <p className="text-xs text-gray-500">{salon.name}</p>
          <h1 className="text-lg font-bold mt-1">施術カルテ</h1>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-base font-medium">{menuDisplay}</p>
            <p className="text-xs text-gray-600">{formatDateJa(record.treatment_date)}</p>
          </div>
          {customer && (
            <p className="text-sm mt-1">
              顧客: <span className="font-medium">{customer.last_name} {customer.first_name}</span>
            </p>
          )}
        </div>

        {/* 施術メニュー */}
        {menus.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">施術メニュー</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 font-medium">メニュー</th>
                  <th className="text-right py-1 font-medium w-16">時間</th>
                  <th className="text-right py-1 font-medium w-20">金額</th>
                  <th className="text-right py-1 font-medium w-16">支払</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => (
                  <tr key={m.id} className="border-b border-gray-200">
                    <td className="py-1">{m.menu_name_snapshot}</td>
                    <td className="text-right py-1">{m.duration_minutes_snapshot ? `${m.duration_minutes_snapshot}分` : ""}</td>
                    <td className="text-right py-1">{m.price_snapshot != null ? `${m.price_snapshot.toLocaleString()}円` : ""}</td>
                    <td className="text-right py-1 text-xs">{PAYMENT_LABELS[m.payment_type] ?? m.payment_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 施術詳細 */}
        <section className="mb-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">施術詳細</h2>
          <div className="space-y-2">
            {detailFields.map((f) =>
              f.value ? (
                <div key={f.label}>
                  <p className="text-xs font-medium text-gray-500">{f.label}</p>
                  <p className="whitespace-pre-wrap mt-0.5">{f.value}</p>
                </div>
              ) : null,
            )}
            {detailFields.every((f) => !f.value) && (
              <p className="text-xs text-gray-400">記録なし</p>
            )}
          </div>
        </section>

        {/* 回数券販売 */}
        {tickets.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">回数券販売</h2>
            {tickets.map((t) => (
              <div key={t.id} className="flex justify-between py-1 border-b border-gray-200 text-sm">
                <span>{t.ticket_name}（{t.total_sessions}回）</span>
                {t.price != null && <span>{t.price.toLocaleString()}円</span>}
              </div>
            ))}
          </section>
        )}

        {/* 物販記録 */}
        {purchases.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">物販記録</h2>
            {purchases.map((p) => (
              <div key={p.id} className="flex justify-between py-1 border-b border-gray-200 text-sm">
                <span>{p.item_name} × {p.quantity}</span>
                <span>{p.total_price.toLocaleString()}円</span>
              </div>
            ))}
          </section>
        )}

        {/* 写真: Before/Afterをペアで横並び、ページ跨ぎ対応 */}
        {photos.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">写真</h2>
            {(() => {
              const maxPairs = Math.max(beforePhotos.length, afterPhotos.length);
              return Array.from({ length: maxPairs }, (_, i) => {
                const bp = beforePhotos[i];
                const ap = afterPhotos[i];
                const bUrl = bp ? photoUrlMap.get(bp.storage_path) : null;
                const aUrl = ap ? photoUrlMap.get(ap.storage_path) : null;
                if (!bUrl && !aUrl) return null;
                return (
                  <div key={i} className="grid grid-cols-2 gap-3 mb-3 break-inside-avoid">
                    <div>
                      {i === 0 && <p className="text-xs font-medium text-gray-500 mb-1">Before</p>}
                      {bUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bUrl} alt="Before" className="w-full max-h-[35vh] object-contain rounded border print:max-h-[200px]" />
                          {bp?.memo && <p className="text-xs text-gray-500 mt-0.5">{bp.memo}</p>}
                        </>
                      ) : <div />}
                    </div>
                    <div>
                      {i === 0 && <p className="text-xs font-medium text-gray-500 mb-1">After</p>}
                      {aUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={aUrl} alt="After" className="w-full max-h-[35vh] object-contain rounded border print:max-h-[200px]" />
                          {ap?.memo && <p className="text-xs text-gray-500 mt-0.5">{ap.memo}</p>}
                        </>
                      ) : <div />}
                    </div>
                  </div>
                );
              });
            })()}
          </section>
        )}

        {/* フッター */}
        <div className="border-t border-gray-300 pt-2 mt-6 text-xs text-gray-400 text-center print:mt-auto">
          {salon.name} — 出力日: {new Date().toLocaleDateString("ja-JP")}
        </div>
      </div>
    </>
  );
}
