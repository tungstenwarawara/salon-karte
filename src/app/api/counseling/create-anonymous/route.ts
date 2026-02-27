import { NextResponse } from "next/server";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

// POST: 匿名カウンセリングシート作成（新規顧客用、サロンオーナー認証済み）
export async function POST(request: Request) {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { template_id } = (body ?? {}) as { template_id?: string | null };

  // template_idが指定された場合、このサロンのテンプレートか確認
  if (template_id) {
    const { data: tmpl } = await supabase
      .from("counseling_templates")
      .select("id")
      .eq("id", template_id)
      .eq("salon_id", salon.id)
      .single();

    if (!tmpl) {
      return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
    }
  }

  // 有効期限: 7日後
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // customer_id = null で匿名シート作成
  const { data, error } = await supabase
    .from("counseling_sheets")
    .insert({
      salon_id: salon.id,
      template_id: template_id ?? null,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, token")
    .single();

  if (error) {
    return NextResponse.json({ error: `作成に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ token: data.token });
}
