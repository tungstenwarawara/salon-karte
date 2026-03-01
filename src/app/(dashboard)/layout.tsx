import { DashboardHeader } from "@/components/layout/dashboard-header";
import { FlashToast } from "@/components/ui/toast";
import { SentryUserContext } from "@/components/sentry-user-context";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, salon, staff } = await getAuthAndSalon();

  return (
    <div className="min-h-screen pb-20">
      {user && salon && <SentryUserContext userId={user.id} salonId={salon.id} />}
      <DashboardHeader staffRole={staff?.role ?? null} />
      <FlashToast />
      <main className="px-4 py-4 max-w-2xl mx-auto">{children}</main>
    </div>
  );
}
