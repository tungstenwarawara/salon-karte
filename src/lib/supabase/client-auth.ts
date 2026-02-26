import { createClient } from "./client";

type StaffInfo = {
  id: string;
  salon_id: string;
  role: "owner" | "manager" | "staff";
  name: string;
};

type ClientAuthResult = {
  user: { id: string; email?: string } | null;
  salonId: string | null;
  staff: StaffInfo | null;
};

/**
 * Client Component 用の認証 + サロン解決ヘルパー。
 * staff テーブル経由で salon_id を取得し、フォールバックで owner_id を使用。
 *
 * 使用例:
 * ```
 * const { user, salonId, staff } = await getClientAuth();
 * if (!user || !salonId) { setError("認証エラー"); return; }
 * ```
 */
export async function getClientAuth(): Promise<ClientAuthResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, salonId: null, staff: null };
  }

  // staff テーブルで検索（プライマリパス）
  const { data: staffRecord } = await supabase
    .from("staff")
    .select("id, salon_id, role, name")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (staffRecord) {
    return {
      user: { id: user.id, email: user.email },
      salonId: staffRecord.salon_id,
      staff: staffRecord as StaffInfo,
    };
  }

  // フォールバック: owner_id で検索（移行期対応）
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single<{ id: string }>();

  return {
    user: { id: user.id, email: user.email },
    salonId: salon?.id ?? null,
    staff: null,
  };
}
