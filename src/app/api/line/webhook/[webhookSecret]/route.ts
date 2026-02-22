import { NextResponse } from "next/server";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyLineSignature } from "@/lib/line/webhook-verify";
import { decrypt } from "@/lib/line/crypto";
import { handleLineEvents } from "@/lib/line/event-handler";

// POST: LINE Webhook受信
export async function POST(
  request: Request,
  { params }: { params: Promise<{ webhookSecret: string }> }
) {
  const { webhookSecret } = await params;
  const body = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  // webhookSecretでサロンのLINE設定を検索
  const adminClient = createAdminClient();
  const { data: config } = await adminClient
    .from("salon_line_configs")
    .select("id, salon_id, channel_secret_encrypted, channel_access_token_encrypted, is_active")
    .eq("webhook_secret", webhookSecret)
    .single();

  if (!config) {
    return NextResponse.json({ error: "不正なWebhook URL" }, { status: 404 });
  }

  if (!config.is_active) {
    return NextResponse.json({ ok: true });
  }

  // LINE署名検証
  const channelSecret = decrypt(config.channel_secret_encrypted);
  if (!verifyLineSignature(channelSecret, body, signature)) {
    return NextResponse.json({ error: "署名検証失敗" }, { status: 403 });
  }

  // バックグラウンドでイベント処理（LINE要件: 1秒以内に200を返す）
  const parsed = JSON.parse(body);
  const events = parsed.events ?? [];

  after(async () => {
    try {
      await handleLineEvents(
        adminClient,
        config.salon_id,
        config.channel_access_token_encrypted,
        events
      );
    } catch (err) {
      console.error("LINE Webhookイベント処理エラー:", err);
    }
  });

  return NextResponse.json({ ok: true });
}
