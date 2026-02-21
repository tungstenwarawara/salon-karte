import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { AppointmentsView } from "@/components/appointments/appointments-view";
import type { AppointmentWithCustomer } from "@/components/appointments/appointment-card";

export default async function AppointmentsPage() {
  const { user, salon, supabase } = await getAuthAndSalon();

  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  // 今月の予約を Server 側で取得（初回表示を高速化）
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startDate = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(first.getDate()).padStart(2, "0")}`;
  const endDate = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, customers(last_name, first_name)")
    .eq("salon_id", salon.id)
    .gte("appointment_date", startDate)
    .lte("appointment_date", endDate)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true })
    .returns<AppointmentWithCustomer[]>();

  return (
    <AppointmentsView
      salonId={salon.id}
      initialAppointments={appointments ?? []}
      initialBusinessHours={salon.business_hours}
      initialSalonHolidays={salon.salon_holidays}
    />
  );
}
