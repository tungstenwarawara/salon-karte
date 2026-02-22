import { NextResponse } from "next/server";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { decrypt } from "@/lib/line/crypto";
import { getFollowerIds, getLineProfile } from "@/lib/line/api";

// POST: 既存フォロワーを同期
export async function POST() {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  // LINE設定取得
  const { data: config } = await supabase
    .from("salon_line_configs")
    .select("channel_access_token_encrypted, is_active")
    .eq("salon_id", salon.id)
    .single();

  if (!config || !config.is_active) {
    return NextResponse.json({ error: "LINE連携が有効ではありません" }, { status: 400 });
  }

  const accessToken = decrypt(config.channel_access_token_encrypted);

  // フォロワーID一覧取得
  let followerIds: string[];
  try {
    followerIds = await getFollowerIds(accessToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    console.error("フォロワーID取得エラー:", message);

    // 無料アカウントではフォロワーID取得APIが利用不可
    if (message.includes("403")) {
      return NextResponse.json(
        { error: "この機能はLINE公式アカウントの「認証済みアカウント」以上で利用できます。LINE Official Account Managerからアカウント認証を申請してください。" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: `フォロワー取得に失敗しました: ${message}` }, { status: 500 });
  }

  if (followerIds.length === 0) {
    return NextResponse.json({ added: 0, updated: 0 });
  }

  // 既存レコードのline_user_idを取得
  const { data: existingLinks } = await supabase
    .from("customer_line_links")
    .select("line_user_id")
    .eq("salon_id", salon.id);
  const existingIds = new Set((existingLinks ?? []).map((l) => l.line_user_id));

  // 新規フォロワーのみプロフィール取得（5件ずつ並列）
  const newIds = followerIds.filter((id) => !existingIds.has(id));
  let added = 0;

  for (let i = 0; i < newIds.length; i += 5) {
    const batch = newIds.slice(i, i + 5);
    const profiles = await Promise.allSettled(
      batch.map((id) => getLineProfile(accessToken, id))
    );

    const rows = profiles
      .map((result, idx) => {
        if (result.status !== "fulfilled") return null;
        const profile = result.value;
        return {
          salon_id: salon.id,
          line_user_id: batch[idx],
          display_name: profile.displayName,
          picture_url: profile.pictureUrl ?? null,
          is_following: true,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("customer_line_links")
        .upsert(rows, { onConflict: "salon_id,line_user_id" });
      if (!upsertError) added += rows.length;
    }
  }

  return NextResponse.json({ added, total: followerIds.length });
}
