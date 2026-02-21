import { DashboardHeader } from "@/components/layout/dashboard-header";
import { FlashToast } from "@/components/ui/toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader />
      <FlashToast />
      <main className="px-4 py-4 max-w-2xl mx-auto">{children}</main>
    </div>
  );
}
