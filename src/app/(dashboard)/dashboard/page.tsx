import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";

type Salon = Database["public"]["Tables"]["salons"]["Row"];
type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // サロン情報を取得
  const { data: salon } = await supabase
    .from("salons")
    .select("*")
    .eq("owner_id", user.id)
    .single<Salon>();

  if (!salon) {
    redirect("/setup");
  }

  // 顧客数を取得
  const { count: customerCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salon.id);

  // 最近の施術記録を取得
  const { data: recentRecords } = await supabase
    .from("treatment_records")
    .select("*, customers(last_name, first_name)")
    .eq("salon_id", salon.id)
    .order("treatment_date", { ascending: false })
    .limit(5)
    .returns<(TreatmentRecord & { customers: { last_name: string; first_name: string } | null })[]>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{salon.name}</h2>
        <p className="text-text-light text-sm mt-1">ダッシュボード</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/customers/new"
          className="bg-surface border border-border rounded-2xl p-4 text-center hover:border-accent transition-colors min-h-[80px] flex flex-col items-center justify-center"
        >
          <span className="text-2xl mb-1">+</span>
          <span className="text-sm font-medium">顧客を追加</span>
        </Link>
        <Link
          href="/customers"
          className="bg-surface border border-border rounded-2xl p-4 text-center hover:border-accent transition-colors min-h-[80px] flex flex-col items-center justify-center"
        >
          <span className="text-2xl mb-1">{customerCount ?? 0}</span>
          <span className="text-sm font-medium">顧客一覧</span>
        </Link>
      </div>

      {/* Recent records */}
      <div>
        <h3 className="font-bold mb-3">最近の施術記録</h3>
        {recentRecords && recentRecords.length > 0 ? (
          <div className="space-y-2">
            {recentRecords.map((record) => {
              const customer = record.customers;
              return (
                <Link
                  key={record.id}
                  href={`/records/${record.id}`}
                  className="block bg-surface border border-border rounded-xl p-3 hover:border-accent transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {customer
                        ? `${customer.last_name} ${customer.first_name}`
                        : "不明"}
                    </span>
                    <span className="text-sm text-text-light">
                      {record.treatment_date}
                    </span>
                  </div>
                  {record.menu_name_snapshot && (
                    <p className="text-sm text-text-light mt-1">
                      {record.menu_name_snapshot}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 text-center text-text-light">
            <p>施術記録はまだありません</p>
            <p className="text-sm mt-1">
              顧客を登録して、カルテの作成を始めましょう
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
