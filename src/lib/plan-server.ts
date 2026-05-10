/**
 * プラン使用状況のサーバーサイド取得
 *
 * Server Component / API Route から呼び出して、現在の利用件数を取得する。
 * 全クエリは並列実行し、count: "exact" + head: true でデータ転送ゼロ。
 */
import { createClient } from "@/lib/supabase/server";
import type { PlanUsage } from "@/lib/plan";

/** 現在の使用状況を取得（並列・count のみ） */
export async function fetchCurrentUsage(salonId: string): Promise<PlanUsage> {
  const supabase = await createClient();

  // 今月の範囲を YYYY-MM-DD 文字列で生成（appointments.appointment_date は date 型）
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const startOfNextMonth = (() => {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
  })();

  const [customersRes, recordsRes, appointmentsRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId),
    supabase
      .from("treatment_records")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .gte("appointment_date", startOfMonth)
      .lt("appointment_date", startOfNextMonth),
  ]);

  return {
    customers: customersRes.count ?? 0,
    records: recordsRes.count ?? 0,
    appointmentsThisMonth: appointmentsRes.count ?? 0,
  };
}
