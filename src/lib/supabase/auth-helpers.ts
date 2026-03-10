import { cache } from "react";
import { createClient } from "./server";
import type { Database } from "@/types/database";

type Salon = Database["public"]["Tables"]["salons"]["Row"];

export type StaffInfo = {
  id: string;
  role: "owner" | "manager" | "staff";
  name: string;
};

/**
 * リクエスト内で getUser() + staff + salon 取得を1回だけ実行するキャッシュ付きヘルパー。
 * React の cache() を使い、同一リクエスト内の複数呼び出しで DB アクセスを重複させない。
 *
 * 解決順序:
 * 1. staff テーブルで auth_user_id = user.id を検索（プライマリパス）
 * 2. フォールバック: salons.owner_id = user.id（移行期安全策）
 *
 * Server Component / Server Action / Route Handler で使用可能。
 * Client Component では使用不可（代わりに getClientAuth() を使う）。
 */
export const getAuthAndSalon = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, salon: null, staff: null as StaffInfo | null, supabase };
  }

  // staff + salons を JOIN で1クエリ取得（逐次2クエリ → 1クエリに最適化）
  const { data: staffWithSalon } = await supabase
    .from("staff")
    .select("id, salon_id, role, name, salons(id, name, phone, address, business_hours, salon_holidays, plan_type)")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (staffWithSalon) {
    const salon = staffWithSalon.salons as unknown as Salon | null;
    return {
      user,
      salon,
      staff: {
        id: staffWithSalon.id,
        role: staffWithSalon.role as StaffInfo["role"],
        name: staffWithSalon.name,
      },
      supabase,
    };
  }

  // フォールバック: owner_id で検索（staff レコードがない移行期対応）
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, phone, address, business_hours, salon_holidays, plan_type")
    .eq("owner_id", user.id)
    .single<Salon>();

  return { user, salon, staff: null as StaffInfo | null, supabase };
});
