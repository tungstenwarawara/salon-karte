import { cache } from "react";
import { createClient } from "./server";
import type { Database } from "@/types/database";

type Salon = Database["public"]["Tables"]["salons"]["Row"];

/**
 * リクエスト内で getUser() + salon 取得を1回だけ実行するキャッシュ付きヘルパー。
 * React の cache() を使い、同一リクエスト内の複数呼び出しで DB アクセスを重複させない。
 *
 * Server Component / Server Action / Route Handler で使用可能。
 * Client Component では使用不可（代わりに useSalonContext() を使う）。
 */
export const getAuthAndSalon = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, salon: null, supabase };
  }

  const { data: salon } = await supabase
    .from("salons")
    .select("*")
    .eq("owner_id", user.id)
    .single<Salon>();

  return { user, salon, supabase };
});
