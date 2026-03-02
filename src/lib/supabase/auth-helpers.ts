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

  // staff テーブルで検索（プライマリパス）
  const { data: staffRecord } = await supabase
    .from("staff")
    .select("id, salon_id, role, name")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (staffRecord) {
    const { data: salon } = await supabase
      .from("salons")
      .select("id, name, phone, address, business_hours, salon_holidays, plan_type")
      .eq("id", staffRecord.salon_id)
      .single<Salon>();

    return {
      user,
      salon,
      staff: {
        id: staffRecord.id,
        role: staffRecord.role as StaffInfo["role"],
        name: staffRecord.name,
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
