import { NextResponse } from "next/server";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { encrypt } from "@/lib/line/crypto";

// POST: LINE設定の保存（新規作成 or 更新）
export async function POST(request: Request) {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const body = await request.json();
  const { channel_id, channel_secret, channel_access_token } = body as {
    channel_id: string;
    channel_secret: string;
    channel_access_token: string;
  };

  if (!channel_id || !channel_secret || !channel_access_token) {
    return NextResponse.json({ error: "全項目を入力してください" }, { status: 400 });
  }

  // 暗号化してDB保存
  const payload = {
    salon_id: salon.id,
    channel_id,
    channel_secret_encrypted: encrypt(channel_secret),
    channel_access_token_encrypted: encrypt(channel_access_token),
  };

  // upsert: salon_idがUNIQUEなのでON CONFLICT UPDATE
  const { data, error } = await supabase
    .from("salon_line_configs")
    .upsert(payload, { onConflict: "salon_id" })
    .select("id, webhook_secret, is_active, reminder_enabled, confirmation_enabled")
    .single();

  if (error) {
    console.error("LINE設定保存エラー:", error.message);
    return NextResponse.json({ error: `保存に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}

// PATCH: 通知設定の更新（ON/OFFトグル）
export async function PATCH(request: Request) {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, boolean> = {};

  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (typeof body.reminder_enabled === "boolean") updates.reminder_enabled = body.reminder_enabled;
  if (typeof body.confirmation_enabled === "boolean") updates.confirmation_enabled = body.confirmation_enabled;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "更新する項目がありません" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("salon_line_configs")
    .update(updates)
    .eq("salon_id", salon.id)
    .select("id, is_active, reminder_enabled, confirmation_enabled")
    .single();

  if (error) {
    console.error("LINE設定更新エラー:", error.message);
    return NextResponse.json({ error: `更新に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}

// DELETE: LINE連携解除
export async function DELETE() {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const { error } = await supabase
    .from("salon_line_configs")
    .delete()
    .eq("salon_id", salon.id);

  if (error) {
    console.error("LINE設定削除エラー:", error.message);
    return NextResponse.json({ error: `削除に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
