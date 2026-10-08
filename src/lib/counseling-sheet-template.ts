// 公開カウンセリングシートに適用するテンプレートの解決（表示ページと送信APIで共用）
// 両者で解決結果がずれると、お客様に見せていない項目で顧客情報を上書きしてしまうため、必ずここを通す

import type { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_COUNSELING_TEMPLATE } from "@/lib/counseling-default-template";
import { resolveHiddenCustomerInfoFields, type OptionalCustomerInfoField } from "@/lib/counseling-customer-info";
import type { CounselingTemplate } from "@/types/counseling-template";

type AdminClient = ReturnType<typeof createAdminClient>;

export type ResolvedSheetTemplate = {
  salonName: string;
  template: CounselingTemplate;
  templateName: string | null;
  hiddenCustomerInfoFields: OptionalCustomerInfoField[];
};

/** template_id → counseling_templates → salons.counseling_template → デフォルト の順で解決する */
export async function resolveSheetTemplate(
  admin: AdminClient,
  sheet: { salon_id: string; template_id: string | null },
): Promise<ResolvedSheetTemplate> {
  const { data: salonData } = await admin
    .from("salons")
    .select("name, counseling_template, business_type")
    .eq("id", sheet.salon_id)
    .single();

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

  return {
    salonName: salonData?.name ?? "サロン",
    template,
    templateName,
    hiddenCustomerInfoFields: resolveHiddenCustomerInfoFields(template, salonData?.business_type),
  };
}
