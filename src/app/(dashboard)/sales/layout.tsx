import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

export default async function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, salon, staff } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");
  if (staff && staff.role !== "owner") redirect("/dashboard");

  return <>{children}</>;
}
