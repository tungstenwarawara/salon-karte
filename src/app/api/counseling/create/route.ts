import { NextResponse } from "next/server";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

// POST: カウンセリングシート作成（サロンオーナー認証済み）
export async function POST(request: Request) {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const body = await request.json();
  const { customer_id } = body as { customer_id: string };

  if (!customer_id) {
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

  // 有効期限: 7日後
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("counseling_sheets")
    .insert({
      salon_id: salon.id,
      customer_id,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, token")
    .single();

  if (error) {
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ token: data.token });
}
