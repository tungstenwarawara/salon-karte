import { NextResponse } from "next/server";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

// POST: LINEユーザーと顧客を手動紐付け
export async function POST(request: Request) {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user || !salon) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const body = await request.json();
  const { link_id, customer_id } = body as { link_id: string; customer_id: string | null };

  if (!link_id) {
    return NextResponse.json({ error: "紐付けIDが必要です" }, { status: 400 });
  }

  const { error } = await supabase
    .from("customer_line_links")
    .update({
      customer_id: customer_id || null,
      linked_at: customer_id ? new Date().toISOString() : null,
    })
    .eq("id", link_id)
    .eq("salon_id", salon.id);

  if (error) {
    console.error("LINE紐付けエラー:", error.message);
    return NextResponse.json({ error: `紐付けに失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
