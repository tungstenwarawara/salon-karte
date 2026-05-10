/** 料金プラン定義・制限チェック */

export type PlanType = "free" | "standard";

/** カウント系の制限項目 */
export type LimitType = "customers" | "records" | "appointmentsThisMonth";

/** 機能ロック系の項目 */
export type FeatureType =
  | "photoStorage"
  | "lineIntegration"
  | "counselingSheet"
  | "salesAnalytics";

/** 現在の使用状況（fetchCurrentUsage で取得） */
export interface PlanUsage {
  customers: number;
  records: number;
  appointmentsThisMonth: number;
}

/** プランごとの制限 */
export const PLAN_LIMITS = {
  free: {
    label: "おためしプラン",
    monthlyPriceJpy: 0,
    maxCustomers: 50,
    maxRecords: 100,
    maxAppointmentsPerMonth: 30,
    photoStorage: false,
    lineIntegration: false,
    counselingSheet: false,
    salesAnalytics: false,
  },
  standard: {
    label: "スタンダードプラン",
    monthlyPriceJpy: 2980,
    maxCustomers: Infinity,
    maxRecords: Infinity,
    maxAppointmentsPerMonth: Infinity,
    photoStorage: true,
    lineIntegration: true,
    counselingSheet: true,
    salesAnalytics: true,
  },
} as const;

/** 警告を出し始める割合（80%） */
const APPROACHING_LIMIT_RATIO = 0.8;

/** プランの表示名を取得 */
export function getPlanLabel(planType: PlanType): string {
  return PLAN_LIMITS[planType].label;
}

/** 上限値を取得（standard は Infinity） */
export function getLimit(planType: PlanType, type: LimitType): number {
  const limits = PLAN_LIMITS[planType];
  switch (type) {
    case "customers":
      return limits.maxCustomers;
    case "records":
      return limits.maxRecords;
    case "appointmentsThisMonth":
      return limits.maxAppointmentsPerMonth;
  }
}

/** 上限到達か */
export function isAtLimit(
  planType: PlanType,
  type: LimitType,
  current: number
): boolean {
  const limit = getLimit(planType, type);
  return current >= limit;
}

/** 80%以上で警告レベルか（上限到達済みは含まない） */
export function isApproachingLimit(
  planType: PlanType,
  type: LimitType,
  current: number
): boolean {
  const limit = getLimit(planType, type);
  if (!isFinite(limit)) return false; // standard は無限なので警告なし
  return current >= limit * APPROACHING_LIMIT_RATIO && current < limit;
}

/** 残り枠（standard は Infinity） */
export function getRemainingQuota(
  planType: PlanType,
  type: LimitType,
  current: number
): number {
  const limit = getLimit(planType, type);
  if (!isFinite(limit)) return Infinity;
  return Math.max(0, limit - current);
}

/** 使用率（0〜1, standard は常に 0） */
export function getUsageRatio(
  planType: PlanType,
  type: LimitType,
  current: number
): number {
  const limit = getLimit(planType, type);
  if (!isFinite(limit)) return 0;
  return Math.min(1, current / limit);
}

/** 機能が使えるか */
export function canUseFeature(
  planType: PlanType,
  feature: FeatureType
): boolean {
  return PLAN_LIMITS[planType][feature];
}

/** 制限項目の日本語ラベル */
export function getLimitLabel(type: LimitType): string {
  switch (type) {
    case "customers":
      return "顧客";
    case "records":
      return "カルテ";
    case "appointmentsThisMonth":
      return "予約（今月）";
  }
}

/** 機能項目の日本語ラベル */
export function getFeatureLabel(feature: FeatureType): string {
  switch (feature) {
    case "photoStorage":
      return "施術写真";
    case "lineIntegration":
      return "LINE連携";
    case "counselingSheet":
      return "カウンセリングシート";
    case "salesAnalytics":
      return "売上分析";
  }
}
