import { DashboardHeader } from "@/components/layout/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader />
      <main className="px-4 py-4 max-w-2xl mx-auto">{children}</main>
    </div>
  );
}
