import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { DailyLedgerView } from "@/components/sales/daily-ledger-view";

export default async function DailyPage() {
  const { user, salon } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  return <DailyLedgerView salonId={salon.id} />;
}
