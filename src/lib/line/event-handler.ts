import { SupabaseClient } from "@supabase/supabase-js";
import { getLineProfile } from "./api";
import { decrypt } from "./crypto";

type LineEvent = {
  type: string;
  source: { userId: string; type: string };
  replyToken?: string;
};

// LINE Webhookイベントを処理（Admin Clientで実行）
export async function handleLineEvents(
  adminClient: SupabaseClient,
  salonId: string,
  channelAccessTokenEncrypted: string,
  events: LineEvent[]
) {
  const accessToken = decrypt(channelAccessTokenEncrypted);

  for (const event of events) {
    if (event.source.type !== "user") continue;
    const lineUserId = event.source.userId;

    if (event.type === "follow") {
      // プロフィール取得
      let displayName: string | null = null;
      let pictureUrl: string | null = null;
      try {
        const profile = await getLineProfile(accessToken, lineUserId);
        displayName = profile.displayName;
        pictureUrl = profile.pictureUrl ?? null;
      } catch (err) {
        console.error("LINEプロフィール取得エラー:", err);
      }

      // upsert: 既存レコードがあれば is_following=true に更新
      await adminClient
        .from("customer_line_links")
        .upsert(
          {
            salon_id: salonId,
            line_user_id: lineUserId,
            display_name: displayName,
            picture_url: pictureUrl,
            is_following: true,
          },
          { onConflict: "salon_id,line_user_id" }
        );
    } else if (event.type === "unfollow") {
      // ブロック・友だち削除時
      await adminClient
        .from("customer_line_links")
        .update({ is_following: false })
        .eq("salon_id", salonId)
        .eq("line_user_id", lineUserId);
    }
  }
}
