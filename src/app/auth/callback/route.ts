import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// オープンリダイレクト防止: 許可するパスのみリダイレクト
const ALLOWED_REDIRECT_PATHS = ["/dashboard", "/setup", "/settings", "/update-password"];

function getSafeRedirectPath(next: string | null): string | null {
  if (!next) return null;
  // 相対パスのみ許可（//external.com や https:// を拒否）
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  // 許可リストに含まれるパスかチェック
  if (ALLOWED_REDIRECT_PATHS.some((path) => next.startsWith(path))) {
    return next;
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If redirecting to a specific page (e.g., password reset), respect it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // staff テーブルで所属サロン確認
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // staff テーブルで検索（プライマリパス）
        const { data: staffRecord } = await supabase
          .from("staff")
          .select("salon_id")
          .eq("auth_user_id", user.id)
          .eq("is_active", true)
          .single();

        if (staffRecord) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }

        // フォールバック: owner_id で確認
        const { data: salon } = await supabase
          .from("salons")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (salon) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }

      return NextResponse.redirect(`${origin}/setup`);
    }
  }

  // Auth error - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
