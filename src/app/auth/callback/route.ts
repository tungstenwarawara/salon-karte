import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";

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

/**
 * 認証コールバックルート
 * - PKCE フロー: ?code=... で来る場合
 * - トークンハッシュ: ?token_hash=...&type=invite で来る場合（招待メール等）
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirectPath(searchParams.get("next"));

  const supabase = await createClient();
  let authSuccess = false;

  // 招待・パスワードリセットフローでは既存セッションをクリアしてからトークンを処理
  // 既存セッション（例: オーナー）が残っていると、トークン検証が失敗し
  // /login にリダイレクト → ミドルウェアが既存セッションで /dashboard に転送してしまう
  // 注: type が invite/recovery の場合のみ（通常のOAuth codeフローは対象外）
  const isInviteOrRecovery = type === "invite" || type === "recovery";
  if (isInviteOrRecovery) {
    await supabase.auth.signOut();
  }

  // パターン1: PKCE コードフロー
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authSuccess = !error;
  }

  // パターン2: トークンハッシュフロー（招待メール等）
  if (!authSuccess && tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    authSuccess = !error;
  }

  if (authSuccess) {
    // next パラメータが指定されている場合（パスワード設定等）
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

  // 認証失敗 - ログインページにリダイレクト
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
