import type { Database, BusinessHours } from "@/types/database";

export type TreatmentMenu = Database["public"]["Tables"]["treatment_menus"]["Row"];

export type DayAppointment = {
  id: string;
  start_time: string;
  end_time: string | null;
  customers: { last_name: string; first_name: string } | null;
};

export const SOURCE_OPTIONS = [
  { value: "direct", label: "直接予約" },
  { value: "hotpepper", label: "ホットペッパー" },
  { value: "phone", label: "電話" },
  { value: "line", label: "LINE" },
  { value: "other", label: "その他" },
];

export const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

export const SELECT_CLASS =
  "flex-1 rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

export type { BusinessHours };
