import { redirect } from "next/navigation";

// 旧物販単独入口は 2026-05-11 にカルテ作成画面（種別=product_only）に統合された。
// 既存ブックマーク・外部リンク対策のためリダイレクトのみ残す。
export default async function LegacyPurchasesNewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/records/new?customer=${id}&type=product_only`);
}
