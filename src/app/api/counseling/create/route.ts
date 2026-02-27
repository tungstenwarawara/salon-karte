import { NextResponse } from "next/server";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

// POST: カウンセリングシート作成（サロンオーナー認証済み）
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

  const { customer_id, template_id, include_customer_info } = (body ?? {}) as {
    customer_id: string;
    template_id?: string | null;
    include_customer_info?: boolean;
  };

  if (!customer_id || typeof customer_id !== "string") {
    return NextResponse.json({ error: "顧客IDが必要です" }, { status: 400 });
  }

  // 顧客がこのサロンに所属しているか確認
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customer_id)
    .eq("salon_id", salon.id)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "顧客が見つかりません" }, { status: 404 });
  }

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

  const { data, error } = await supabase
    .from("counseling_sheets")
    .insert({
      salon_id: salon.id,
      customer_id,
      template_id: template_id ?? null,
      include_customer_info: include_customer_info ?? false,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, token")
    .single();

  if (error) {
    return NextResponse.json({ error: `作成に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ token: data.token });
}
