import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicForm } from "@/components/counseling/public-form";
import { DEFAULT_COUNSELING_TEMPLATE } from "@/lib/counseling-default-template";
import type { CounselingTemplate } from "@/types/counseling-template";

export default async function CounselingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: sheet } = await admin
    .from("counseling_sheets")
    .select("id, token, status, expires_at, salon_id, salons(name, counseling_template)")
    .eq("token", token)
    .single();

  if (!sheet) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
        <p className="text-lg font-bold">無効なリンクです</p>
        <p className="text-sm text-text-light">このリンクは存在しないか、既に削除されています。</p>
      </div>
    );
  }

  if (sheet.status === "submitted") {
    redirect(`/c/${token}/complete`);
  }

  if (new Date(sheet.expires_at) < new Date()) {
    redirect(`/c/${token}/expired`);
  }

  const salonData = sheet.salons as unknown as { name: string; counseling_template: CounselingTemplate | null } | null;
  const salonName = salonData?.name ?? "サロン";
  const template = salonData?.counseling_template ?? DEFAULT_COUNSELING_TEMPLATE;

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">{salonName}</h1>
        <p className="text-sm text-text-light">カウンセリングシート</p>
      </div>
      <PublicForm token={token} template={template} />
    </div>
  );
}
