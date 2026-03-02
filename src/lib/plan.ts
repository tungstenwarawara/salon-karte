/** 料金プラン定義・制限チェック */

export type PlanType = "free" | "standard";

/** プランごとの制限 */
export const PLAN_LIMITS = {
  free: {
    label: "おためしプラン",
    maxCustomers: 10,
    maxRecordsPerCustomer: 5,
    maxAppointmentsPerMonth: 20,
    photoStorage: false,
    lineIntegration: false,
    counselingSheet: false,
    salesAnalytics: false,
  },
  standard: {
    label: "スタンダードプラン",
    maxCustomers: Infinity,
    maxRecordsPerCustomer: Infinity,
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
