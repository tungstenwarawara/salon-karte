import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const CANONICAL_HOST = "salonkarte.com";

export async function middleware(request: NextRequest) {
  // 旧ドメインからカノニカルドメインへリダイレクト
  const host = request.headers.get("host") ?? "";
  if (
    host !== CANONICAL_HOST &&
    host !== `www.${CANONICAL_HOST}` &&
    host !== "localhost:3000" &&
    !host.startsWith("localhost")
  ) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.port = "";
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
