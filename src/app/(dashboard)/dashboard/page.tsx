import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";

type Salon = Database["public"]["Tables"]["salons"]["Row"];
type TreatmentRecord = Database["public"]["Tables"]["treatment_records"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "おはようございます";
  if (hour < 17) return "こんにちは";
  return "おつかれさまです";
}

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

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

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

  // メニュー数を取得（オンボーディング判定用）
  const { count: menuCount } = await supabase
    .from("treatment_menus")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  // 離脱アラート: DB関数で効率的に取得
  type LapsedCustomer = {
    id: string;
    last_name: string;
    first_name: string;
    last_visit_date: string;
    days_since: number;
  };

  const { data: lapsedCustomers } = await supabase
    .rpc("get_lapsed_customers", {
      p_salon_id: salon.id,
      p_days_threshold: 60,
    })
    .returns<LapsedCustomer[]>();

  // 今月の売上サマリー
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

  const [monthlyAptsRes, monthlyPurchasesRes, monthlyTicketsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("appointment_menus(price_snapshot)")
      .eq("salon_id", salon.id)
      .gte("appointment_date", monthStart)
      .lt("appointment_date", monthEnd)
      .eq("status", "completed"),
    supabase
      .from("purchases")
      .select("total_price")
      .eq("salon_id", salon.id)
      .gte("purchase_date", monthStart)
      .lt("purchase_date", monthEnd),
    supabase
      .from("course_tickets")
      .select("price")
      .eq("salon_id", salon.id)
      .gte("purchase_date", monthStart)
      .lt("purchase_date", monthEnd),
  ]);

  const monthlyTreatmentSales = monthlyAptsRes.data?.reduce((sum, apt) => {
    const menus = (apt.appointment_menus ?? []) as { price_snapshot: number | null }[];
    return sum + menus.reduce((mSum, m) => mSum + (m.price_snapshot ?? 0), 0);
  }, 0) ?? 0;

  const monthlyProductSales = monthlyPurchasesRes.data?.reduce((sum, p) => sum + (p as { total_price: number }).total_price, 0) ?? 0;

  const monthlyTicketSales = monthlyTicketsRes.data?.reduce((sum, t) => sum + ((t as { price: number | null }).price ?? 0), 0) ?? 0;

  const monthlyTotal = monthlyTreatmentSales + monthlyProductSales + monthlyTicketSales;

  // 最近の施術記録を取得
  const { data: recentRecords } = await supabase
    .from("treatment_records")
    .select("*, customers(last_name, first_name)")
    .eq("salon_id", salon.id)
    .order("treatment_date", { ascending: false })
    .limit(3)
    .returns<(TreatmentRecord & { customers: { last_name: string; first_name: string } | null })[]>();

  const appointmentCount = todayAppointments?.filter((a) => a.status === "scheduled").length ?? 0;
  const lapsedCount = lapsedCustomers?.length ?? 0;
  const greeting = getGreeting();

  // オンボーディング: 初期設定のチェック
  const hasBusinessHours = salon.business_hours !== null;
  const hasMenus = (menuCount ?? 0) > 0;
  const hasCustomers = (customerCount ?? 0) > 0;
  const setupSteps = [
    { done: hasBusinessHours, label: "営業時間を設定する", href: "/settings/business-hours" },
    { done: hasMenus, label: "施術メニューを登録する", href: "/settings/menus" },
    { done: hasCustomers, label: "最初のお客様を登録する", href: "/customers/new" },
  ];
  const allSetupDone = setupSteps.every((s) => s.done);
  const completedSteps = setupSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-text-light text-sm">{greeting}</p>
        <h2 className="text-xl font-bold mt-0.5">{salon.name}</h2>
      </div>

      {/* Onboarding checklist */}
      {!allSetupDone && (
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">はじめの設定</h3>
            <span className="text-xs text-accent font-medium">{completedSteps}/{setupSteps.length} 完了</span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5">
            <div
              className="bg-accent rounded-full h-1.5 transition-all"
              style={{ width: `${(completedSteps / setupSteps.length) * 100}%` }}
            />
          </div>
          <div className="space-y-2">
            {setupSteps.map((step) => (
              <Link
                key={step.href}
                href={step.href}
                className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                  step.done ? "opacity-60" : "hover:bg-accent/10"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? "bg-success text-white" : "border-2 border-border"
                }`}>
                  {step.done && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${step.done ? "line-through text-text-light" : "font-medium"}`}>
                  {step.label}
                </span>
                {!step.done && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-text-light ml-auto">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Today's summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/appointments"
          className="bg-surface border border-border rounded-2xl p-4 hover:border-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{appointmentCount}</p>
              <p className="text-xs text-text-light">今日の予約</p>
            </div>
          </div>
        </Link>
        {lapsedCount > 0 ? (
          <Link
            href="/customers"
            className="bg-surface border border-orange-200 rounded-2xl p-4 hover:border-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-warning">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{lapsedCount}</p>
                <p className="text-xs text-text-light">要フォロー</p>
              </div>
            </div>
          </Link>
        ) : (
          <Link
            href="/customers"
            className="bg-surface border border-border rounded-2xl p-4 hover:border-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-accent">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{customerCount ?? 0}</p>
                <p className="text-xs text-text-light">顧客数</p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/appointments/new"
          className="bg-surface border border-border rounded-xl p-3 text-center hover:border-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="text-xs font-medium">予約追加</p>
        </Link>
        <Link
          href="/records/new"
          className="bg-surface border border-border rounded-xl p-3 text-center hover:border-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <p className="text-xs font-medium">カルテ作成</p>
        </Link>
        <Link
          href="/customers/new"
          className="bg-surface border border-border rounded-xl p-3 text-center hover:border-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </div>
          <p className="text-xs font-medium">顧客登録</p>
        </Link>
      </div>

      {/* Today's appointments timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">今日の予約</h3>
          <Link
            href="/appointments"
            className="text-xs text-accent hover:underline"
          >
            すべて見る →
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
                      <span className="text-sm font-bold text-accent tabular-nums">
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
                    <p className="text-xs text-text-light mt-1 ml-[3.5rem]">
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

      {/* Monthly sales summary */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">
            今月の売上
          </h3>
          <span className="text-xs text-text-light">
            {now.getFullYear()}年{now.getMonth() + 1}月
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-base font-bold">{monthlyTreatmentSales.toLocaleString()}</p>
            <p className="text-[10px] text-text-light">施術</p>
          </div>
          <div>
            <p className="text-base font-bold">{monthlyProductSales.toLocaleString()}</p>
            <p className="text-[10px] text-text-light">物販</p>
          </div>
          <div>
            <p className="text-base font-bold">{monthlyTicketSales.toLocaleString()}</p>
            <p className="text-[10px] text-text-light">回数券</p>
          </div>
        </div>
        <div className="border-t border-border pt-2 text-center">
          <p className="text-xl font-bold text-accent">{monthlyTotal.toLocaleString()}円</p>
        </div>
      </div>

      {/* Lapsed customers alert */}
      {lapsedCustomers && lapsedCustomers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">
              ご無沙汰のお客様
              <span className="text-xs font-normal text-text-light ml-2">
                60日以上
              </span>
            </h3>
            {lapsedCustomers.length > 3 && (
              <Link href="/customers" className="text-xs text-accent hover:underline">
                他{lapsedCustomers.length - 3}名 →
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {lapsedCustomers.slice(0, 3).map((c) => (
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
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent records */}
      {recentRecords && recentRecords.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">最近のカルテ</h3>
          </div>
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
                    <span className="font-medium text-sm">
                      {customer
                        ? `${customer.last_name} ${customer.first_name}`
                        : "不明"}
                    </span>
                    <span className="text-xs text-text-light">
                      {record.treatment_date}
                    </span>
                  </div>
                  {record.menu_name_snapshot && (
                    <p className="text-xs text-text-light mt-1">
                      {record.menu_name_snapshot}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature discovery tip */}
      {allSetupDone && (
        <div className="bg-accent/5 border border-accent/15 rounded-2xl p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">活用ヒント</p>
              <p className="text-xs text-text-light mt-0.5">
                {lapsedCount > 0
                  ? `${lapsedCount}名のお客様が60日以上ご来店がありません。顧客一覧から確認してフォローしましょう。`
                  : "ビフォーアフター写真をカルテに記録すると、施術経過が一目でわかります。"
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
