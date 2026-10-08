import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveSheetTemplate } from "@/lib/counseling-sheet-template";
import { omitHiddenCustomerInfoFields } from "@/lib/counseling-customer-info";

type CustomerInfoInput = {
  last_name: string;
  first_name: string;
  last_name_kana?: string;
  first_name_kana?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  address?: string;
  marital_status?: string;
  has_children?: string;
  dm_allowed?: string;
  height_cm?: string;
  weight_kg?: string;
  allergies?: string;
  treatment_goal?: string;
};

/** フォーム入力を customers の列に変換する（新規作成・既存顧客の更新で共用） */
function toCustomerColumns(info: CustomerInfoInput) {
  const heightVal = info.height_cm ? parseFloat(info.height_cm) : null;
  const weightVal = info.weight_kg ? parseFloat(info.weight_kg) : null;
  return {
    last_name: info.last_name.trim(),
    first_name: info.first_name.trim(),
    last_name_kana: info.last_name_kana?.trim() || null,
    first_name_kana: info.first_name_kana?.trim() || null,
    birth_date: info.birth_date || null,
    phone: info.phone?.trim() || null,
    email: info.email?.trim() || null,
    address: info.address?.trim() || null,
    marital_status: info.marital_status || null,
    has_children: info.has_children === "" || !info.has_children ? null : info.has_children === "true",
    dm_allowed: info.dm_allowed === "true",
    height_cm: heightVal !== null && !isNaN(heightVal) ? heightVal : null,
    weight_kg: weightVal !== null && !isNaN(weightVal) ? weightVal : null,
    allergies: info.allergies?.trim() || null,
    treatment_goal: info.treatment_goal?.trim() || null,
  };
}

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
    .select("id, status, expires_at, salon_id, customer_id, template_id")
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

  // お客様に表示していない項目は保存しない。
  // 既存顧客の場合、送られてこない項目を空で上書きすると、サロンが登録済みの内容が消えるため
  const hiddenFields = customer_info
    ? (await resolveSheetTemplate(admin, sheet)).hiddenCustomerInfoFields
    : [];

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
        ...omitHiddenCustomerInfoFields(toCustomerColumns(customer_info), hiddenFields),
      })
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      return NextResponse.json({ error: `顧客の作成に失敗しました: ${customerError?.message}` }, { status: 500 });
    }

    customerId = newCustomer.id;
  } else if (customer_info) {
    // 既存顧客の情報更新（include_customer_info有効時）
    await admin
      .from("customers")
      .update(omitHiddenCustomerInfoFields(toCustomerColumns(customer_info), hiddenFields))
      .eq("id", customerId)
      .eq("salon_id", sheet.salon_id);
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
