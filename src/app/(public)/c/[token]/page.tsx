import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicForm } from "@/components/counseling/public-form";
import type { PublicCustomerInfo } from "@/components/counseling/customer-info-step";
import { emptyPublicCustomerInfo } from "@/components/counseling/customer-info-step";
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
    .select("id, token, status, expires_at, salon_id, customer_id, template_id, include_customer_info")
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

  // サロン情報取得
  const { data: salonData } = await admin
    .from("salons")
    .select("name, counseling_template")
    .eq("id", sheet.salon_id)
    .single();

  const salonName = salonData?.name ?? "サロン";

  // テンプレート解決: template_id → counseling_templates → salons.counseling_template → デフォルト
  let template: CounselingTemplate = DEFAULT_COUNSELING_TEMPLATE;
  let templateName: string | null = null;

  if (sheet.template_id) {
    const { data: tmpl } = await admin
      .from("counseling_templates")
      .select("template, name")
      .eq("id", sheet.template_id)
      .eq("salon_id", sheet.salon_id)
      .single();

    if (tmpl) {
      template = tmpl.template as unknown as CounselingTemplate;
      templateName = tmpl.name as string;
    }
  } else if (salonData?.counseling_template) {
    template = salonData.counseling_template as unknown as CounselingTemplate;
  }

  const isAnonymous = sheet.customer_id === null;
  const showCustomerInfo = sheet.include_customer_info ?? false;

  // 既存顧客の場合: include_customer_infoフラグがONなら顧客情報ステップを表示（プリフィル付き）
  let existingCustomerInfo: PublicCustomerInfo | undefined;

  if (sheet.customer_id && showCustomerInfo) {
    const { data: customer } = await admin
      .from("customers")
      .select("last_name, first_name, last_name_kana, first_name_kana, birth_date, phone, email, address, marital_status, has_children, dm_allowed, height_cm, weight_kg, allergies, treatment_goal")
      .eq("id", sheet.customer_id)
      .eq("salon_id", sheet.salon_id)
      .single();

    if (customer) {
      existingCustomerInfo = {
        ...emptyPublicCustomerInfo,
        last_name: customer.last_name ?? "",
        first_name: customer.first_name ?? "",
        last_name_kana: customer.last_name_kana ?? "",
        first_name_kana: customer.first_name_kana ?? "",
        birth_date: customer.birth_date ?? "",
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        address: customer.address ?? "",
        marital_status: customer.marital_status ?? "",
        has_children: customer.has_children === null ? "" : customer.has_children ? "true" : "false",
        dm_allowed: customer.dm_allowed === false ? "false" : "true",
        height_cm: customer.height_cm !== null ? String(customer.height_cm) : "",
        weight_kg: customer.weight_kg !== null ? String(customer.weight_kg) : "",
        allergies: customer.allergies ?? "",
        treatment_goal: customer.treatment_goal ?? "",
      };
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">{salonName}</h1>
        <p className="text-sm text-text-light">
          {templateName ?? "カウンセリングシート"}
        </p>
      </div>
      <PublicForm
        token={token}
        template={template}
        isAnonymous={isAnonymous}
        showCustomerInfo={showCustomerInfo}
        existingCustomerInfo={existingCustomerInfo}
      />
    </div>
  );
}
