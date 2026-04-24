/** 料金プラン定義・制限チェック */

export type PlanType = "free" | "standard";

/** プランごとの制限 */
export const PLAN_LIMITS = {
  free: {
    label: "おためしプラン",
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
    maxCustomers: Infinity,
    maxRecords: Infinity,
    maxAppointmentsPerMonth: Infinity,
    photoStorage: true,
    lineIntegration: true,
    counselingSheet: true,
    salesAnalytics: true,
  },
} as const;

/** プランの表示名を取得 */
export function getPlanLabel(planType: PlanType): string {
  return PLAN_LIMITS[planType].label;
}
