import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 認証チェックが必要なルート
const protectedPaths = ["/dashboard", "/customers", "/records", "/settings", "/setup", "/appointments", "/guide", "/sales"];
const authPaths = ["/login", "/signup"];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保護ルート・認証ページ以外はセッション更新をスキップ
  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthRoute = authPaths.some((path) => pathname === path);

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // パフォーマンス改善: getUser() → getSession() に変更
  // getUser() は毎回 Supabase Auth API に問い合わせるため 100-200ms かかる
  // getSession() はローカルの JWT cookie から読み取るため高速（<5ms）
  // セキュリティ上の認証検証は各ページの getAuthAndSalon() で getUser() が行うため安全
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ログイン済みユーザーを認証ページからリダイレクト
  if (isAuthRoute && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
