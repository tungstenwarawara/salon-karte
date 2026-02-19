import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { BeforeAfterComparison } from "@/components/records/before-after";
import type { Database } from "@/types/database";

type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type TreatmentPhoto = Database["public"]["Tables"]["treatment_photos"]["Row"];

type RecordWithCustomer = TreatmentRecord & {
  customers: { id: string; last_name: string; first_name: string } | null;
};

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");

  // P9: record と photos を並列取得
  const [recordRes, photosRes] = await Promise.all([
    supabase
      .from("treatment_records")
      .select("*, customers(id, last_name, first_name)")
      .eq("id", id)
      .single<RecordWithCustomer>(),
    supabase
      .from("treatment_photos")
      .select("*")
      .eq("treatment_record_id", id)
      .order("photo_type")
      .returns<TreatmentPhoto[]>(),
  ]);

  const record = recordRes.data;
  if (!record) notFound();

  const customer = record.customers;
  const photos = photosRes.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {record.menu_name_snapshot ?? "施術記録"}
          </h2>
          <p className="text-sm text-text-light mt-1">
            {record.treatment_date}
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
