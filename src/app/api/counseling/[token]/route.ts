import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: カウンセリングシート送信（公開API — 認証不要、Admin Client使用）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { responses } = (body ?? {}) as { responses: Record<string, unknown> };

  if (!responses || typeof responses !== "object" || Array.isArray(responses) || Object.keys(responses).length === 0) {
    return NextResponse.json({ error: "回答データが必要です" }, { status: 400 });
  }

  // 回答データのサイズ制限（100KB以上は不正）
  if (JSON.stringify(responses).length > 100_000) {
    return NextResponse.json({ error: "回答データが大きすぎます" }, { status: 400 });
  }

  const admin = createAdminClient();

  // トークンで検索 + 有効性チェック
  const { data: sheet, error: fetchError } = await admin
    .from("counseling_sheets")
    .select("id, status, expires_at")
    .eq("token", token)
    .single();

  if (fetchError || !sheet) {
    return NextResponse.json({ error: "無効なリンクです" }, { status: 404 });
  }

  if (sheet.status === "submitted") {
    return NextResponse.json({ error: "既に回答済みです" }, { status: 400 });
  }

  if (new Date(sheet.expires_at) < new Date()) {
    return NextResponse.json({ error: "リンクの有効期限が切れています" }, { status: 410 });
  }

  // 回答を保存
  const { error: updateError } = await admin
    .from("counseling_sheets")
    .update({
      responses,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", sheet.id);

  if (updateError) {
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
