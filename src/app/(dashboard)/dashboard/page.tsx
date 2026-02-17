import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";

type Salon = Database["public"]["Tables"]["salons"]["Row"];
type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

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

  const today = new Date().toISOString().split("T")[0];

  // 今日の予約を取得
  const { data: todayAppointments } = await supabase
    .from("appointments")
    .select("*, customers(last_name, first_name)")
    .eq("salon_id", salon.id)
    .eq("appointment_date", today)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true })
    .returns<(Appointment & { customers: { last_name: string; first_name: string } | null })[]>();

  // 顧客数を取得
  const { count: customerCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salon.id);

  // 離脱アラート: 60日以上来店がない顧客を取得
  // Get all customers and their latest treatment record
  const { data: allCustomers } = await supabase
    .from("customers")
    .select("id, last_name, first_name")
    .eq("salon_id", salon.id);

  const { data: allRecords } = await supabase
    .from("treatment_records")
    .select("customer_id, treatment_date")
    .eq("salon_id", salon.id);

  // Build last visit map
  const lastVisitMap = new Map<string, string>();
  if (allRecords) {
    for (const record of allRecords) {
      const existing = lastVisitMap.get(record.customer_id);
      if (!existing || record.treatment_date > existing) {
        lastVisitMap.set(record.customer_id, record.treatment_date);
      }
    }
  }

  type LapsedCustomer = {
    id: string;
    last_name: string;
    first_name: string;
    last_visit_date: string;
    days_since: number;
  };

  const lapsedCustomers: LapsedCustomer[] = [];
  if (allCustomers) {
    const now = Date.now();
    for (const c of allCustomers) {
      const lastVisit = lastVisitMap.get(c.id);
      if (lastVisit) {
        const days = Math.floor((now - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 60) {
          lapsedCustomers.push({
            id: c.id,
            last_name: c.last_name,
            first_name: c.first_name,
            last_visit_date: lastVisit,
            days_since: days,
          });
        }
      }
    }
    lapsedCustomers.sort((a, b) => b.days_since - a.days_since);
  }

  // 最近の施術記録を取得
  const { data: recentRecords } = await supabase
    .from("treatment_records")
    .select("*, customers(last_name, first_name)")
    .eq("salon_id", salon.id)
    .order("treatment_date", { ascending: false })
    .limit(5)
    .returns<(TreatmentRecord & { customers: { last_name: string; first_name: string } | null })[]>();

  const appointmentCount = todayAppointments?.filter((a) => a.status === "scheduled").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{salon.name}</h2>
        <p className="text-text-light text-sm mt-1">ダッシュボード</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/appointments"
          className="bg-surface border border-border rounded-2xl p-3 text-center hover:border-accent transition-colors"
        >
          <span className="text-2xl font-bold text-accent">{appointmentCount}</span>
          <p className="text-xs text-text-light mt-0.5">今日の予約</p>
        </Link>
        <Link
          href="/customers"
          className="bg-surface border border-border rounded-2xl p-3 text-center hover:border-accent transition-colors"
        >
          <span className="text-2xl font-bold">{customerCount ?? 0}</span>
          <p className="text-xs text-text-light mt-0.5">顧客数</p>
        </Link>
        <Link
          href="/customers/new"
          className="bg-surface border border-border rounded-2xl p-3 text-center hover:border-accent transition-colors"
        >
          <span className="text-2xl mb-0.5">+</span>
          <p className="text-xs text-text-light mt-0.5">顧客を追加</p>
        </Link>
      </div>

      {/* Today's appointments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">今日の予約</h3>
          <Link
            href="/appointments/new"
            className="text-sm text-accent hover:underline"
          >
            + 予約登録
          </Link>
        </div>
        {todayAppointments && todayAppointments.length > 0 ? (
          <div className="space-y-2">
            {todayAppointments.map((apt) => {
              const customer = apt.customers;
              const isCompleted = apt.status === "completed";
              return (
                <Link
                  key={apt.id}
                  href={`/customers/${apt.customer_id}`}
                  className={`block bg-surface border rounded-xl p-3 hover:border-accent transition-colors ${
                    isCompleted ? "border-green-200 bg-green-50/50" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {(apt.start_time as string).slice(0, 5)}
                      </span>
                      <span className="font-medium text-sm">
                        {customer
                          ? `${customer.last_name} ${customer.first_name}`
                          : "不明"}
                      </span>
                    </div>
                    {isCompleted && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        来店済
                      </span>
                    )}
                  </div>
                  {apt.menu_name_snapshot && (
                    <p className="text-xs text-text-light mt-1">
                      {apt.menu_name_snapshot}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-4 text-center text-text-light text-sm">
            今日の予約はありません
          </div>
        )}
      </div>

      {/* Lapsed customers alert */}
      {lapsedCustomers.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">
            ご無沙汰のお客様
            <span className="text-sm font-normal text-text-light ml-2">
              60日以上来店なし
            </span>
          </h3>
          <div className="space-y-2">
            {lapsedCustomers.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="block bg-surface border border-orange-200 rounded-xl p-3 hover:border-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {c.last_name} {c.first_name}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      c.days_since >= 90 ? "text-red-500" : "text-orange-500"
                    }`}
                  >
                    {c.days_since}日前
                  </span>
                </div>
                <p className="text-xs text-text-light mt-0.5">
                  最終来店: {c.last_visit_date}
                </p>
              </Link>
            ))}
            {lapsedCustomers.length > 5 && (
              <Link
                href="/customers"
                className="block text-center text-sm text-accent hover:underline py-2"
              >
                他{lapsedCustomers.length - 5}名を表示
              </Link>
            )}
          </div>
        </div>
      )}

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
