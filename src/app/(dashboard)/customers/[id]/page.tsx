import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];

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
