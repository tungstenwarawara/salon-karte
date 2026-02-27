import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CustomerInfoInput = {
  last_name: string;
  first_name: string;
  last_name_kana?: string;
  first_name_kana?: string;
  phone?: string;
  email?: string;
  gender?: string;
  birth_date?: string;
};

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

  const { responses, customer_info } = (body ?? {}) as {
    responses: Record<string, unknown>;
    customer_info?: CustomerInfoInput;
  };

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
    .select("id, status, expires_at, salon_id, customer_id")
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

  // 匿名シート: 顧客を自動作成して紐づけ
  let customerId = sheet.customer_id;
  if (!customerId) {
    if (!customer_info?.last_name?.trim() || !customer_info?.first_name?.trim()) {
      return NextResponse.json({ error: "お名前（姓・名）は必須です" }, { status: 400 });
    }

    const { data: newCustomer, error: customerError } = await admin
      .from("customers")
      .insert({
        salon_id: sheet.salon_id,
        last_name: customer_info.last_name.trim(),
        first_name: customer_info.first_name.trim(),
        last_name_kana: customer_info.last_name_kana?.trim() || null,
        first_name_kana: customer_info.first_name_kana?.trim() || null,
        phone: customer_info.phone?.trim() || null,
        email: customer_info.email?.trim() || null,
        birth_date: customer_info.birth_date || null,
      })
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      return NextResponse.json({ error: `顧客の作成に失敗しました: ${customerError?.message}` }, { status: 500 });
    }

    customerId = newCustomer.id;
  }

  // 回答を保存 + 顧客紐づけ
  const { error: updateError } = await admin
    .from("counseling_sheets")
    .update({
      responses,
      customer_id: customerId,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", sheet.id);

  if (updateError) {
    return NextResponse.json({ error: `保存に失敗しました: ${updateError.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
