import { NextResponse } from "next/server";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { decrypt } from "@/lib/line/crypto";
import { sendPushMessage } from "@/lib/line/api";

// POST: テストメッセージ送信
export async function POST(request: Request) {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const body = await request.json();
  const { line_user_id } = body as { line_user_id: string };

  if (!line_user_id) {
    return NextResponse.json({ error: "LINEユーザーIDが必要です" }, { status: 400 });
  }

  // LINE設定を取得
  const { data: config } = await supabase
    .from("salon_line_configs")
    .select("id, channel_access_token_encrypted, is_active")
    .eq("salon_id", salon.id)
    .single();

  if (!config || !config.is_active) {
    return NextResponse.json({ error: "LINE連携が設定されていません" }, { status: 400 });
  }

  const accessToken = decrypt(config.channel_access_token_encrypted);

  try {
    await sendPushMessage(accessToken, line_user_id, [
      { type: "text", text: `${salon.name}からのテスト送信です。このメッセージが届いていれば、LINE連携は正常に動作しています。` },
    ]);

    // ログ記録
    await supabase.from("line_message_logs").insert({
      salon_id: salon.id,
      message_type: "test",
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "送信に失敗しました";
    console.error("LINE テスト送信エラー:", errorMessage);

    await supabase.from("line_message_logs").insert({
      salon_id: salon.id,
      message_type: "test",
      status: "failed",
      error_message: errorMessage,
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
