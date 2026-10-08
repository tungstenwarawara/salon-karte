// カウンセリングシートの「お客様情報」ステップで、サロンが表示・非表示を選べる項目の定義
// お名前・フリガナ・電話番号・メールアドレスは常に表示する（顧客の特定と連絡に必須のため）

import type { BusinessType } from "@/lib/menu-presets";

export const OPTIONAL_CUSTOMER_INFO_FIELDS = [
  { key: "birth_date", label: "生年月日" },
  { key: "address", label: "住所" },
  { key: "marital_status", label: "婚姻状況" },
  { key: "has_children", label: "お子様の有無" },
  { key: "dm_allowed", label: "DM送付" },
  { key: "height_cm", label: "身長" },
  { key: "weight_kg", label: "体重" },
  { key: "allergies", label: "アレルギー・注意事項" },
  { key: "treatment_goal", label: "施術のご希望・目標" },
] as const;

export type OptionalCustomerInfoField = (typeof OPTIONAL_CUSTOMER_INFO_FIELDS)[number]["key"];

const OPTIONAL_KEYS: readonly string[] = OPTIONAL_CUSTOMER_INFO_FIELDS.map((f) => f.key);

function isOptionalField(key: unknown): key is OptionalCustomerInfoField {
  return typeof key === "string" && OPTIONAL_KEYS.includes(key);
}

// 体型・家族構成は施術に関係しない業種では聞かない（お客様に余計な気を遣わせるため）
const BODY_AND_FAMILY_FIELDS: OptionalCustomerInfoField[] = ["marital_status", "has_children", "height_cm", "weight_kg"];

const DEFAULT_HIDDEN_BY_BUSINESS_TYPE: Partial<Record<BusinessType, OptionalCustomerInfoField[]>> = {
  nail: BODY_AND_FAMILY_FIELDS,
  eyelash: BODY_AND_FAMILY_FIELDS,
  hair: BODY_AND_FAMILY_FIELDS,
};

/**
 * お客様情報ステップで表示しない項目を決める。
 * テンプレートで明示的に選ばれていればそれを使い、未設定なら業種ごとの既定に従う。
 * テンプレートは JSONB 由来で中身を信用できないため、既知の項目名だけを通す。
 */
export function resolveHiddenCustomerInfoFields(
  template: { hiddenCustomerInfoFields?: unknown },
  businessType: string | null | undefined,
): OptionalCustomerInfoField[] {
  const explicit = template.hiddenCustomerInfoFields;
  if (Array.isArray(explicit)) return explicit.filter(isOptionalField);
  return [...(DEFAULT_HIDDEN_BY_BUSINESS_TYPE[businessType as BusinessType] ?? [])];
}

/** 非表示の項目を取り除く。お客様に見せていない項目で既存の顧客情報を上書きしないために使う */
export function omitHiddenCustomerInfoFields<T extends Record<string, unknown>>(
  values: T,
  hidden: readonly OptionalCustomerInfoField[],
): Partial<T> {
  const hiddenKeys: readonly string[] = hidden;
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => !hiddenKeys.includes(key)),
  ) as Partial<T>;
}
