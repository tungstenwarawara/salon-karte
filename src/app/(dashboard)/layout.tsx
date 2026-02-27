import { DashboardHeader } from "@/components/layout/dashboard-header";
import { FlashToast } from "@/components/ui/toast";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { staff } = await getAuthAndSalon();

  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader staffRole={staff?.role ?? null} />
      <FlashToast />
      <main className="px-4 py-4 max-w-2xl mx-auto">{children}</main>
    </div>
  );
}
