import { redirect } from "next/navigation";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
import { EmptyState } from "@/components/ui/empty-state";
import { ManagementTabs } from "@/components/inventory/management-tabs";
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard";
import { InventorySetupGuide } from "@/components/inventory/inventory-setup-guide";
import type { InventoryItem } from "@/components/inventory/inventory-dashboard";

export default async function InventoryPage() {
  const { user, salon, supabase } = await getAuthAndSalon();
  if (!user) redirect("/login");
  if (!salon) redirect("/setup");

  // 今月の範囲を計算
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = now.getMonth() === 11
    ? `${now.getFullYear() + 1}-01-31`
    : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}-01`;

  // 商品数・在庫サマリー・今月の仕入額・累計仕入額・セットアップ状態を並列取得
  const [countRes, inventoryRes, purchaseRes, totalPurchaseRes, setupCheckRes] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id),
    supabase.rpc("get_inventory_summary", { p_salon_id: salon.id }),
    supabase
      .from("inventory_logs")
      .select("quantity, unit_cost_price")
      .eq("salon_id", salon.id)
      .eq("log_type", "purchase_in")
      .gte("logged_at", firstDay)
      .lt("logged_at", lastDay),
    // 累計仕入額（全期間の purchase_in）
    supabase
      .from("inventory_logs")
      .select("quantity, unit_cost_price")
      .eq("salon_id", salon.id)
      .eq("log_type", "purchase_in"),
    // 仕入れ or 棚卸しが1件でもあればセットアップ済み
    supabase
      .from("inventory_logs")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .in("log_type", ["purchase_in", "adjust"]),
  ]);

  const hasProducts = (countRes.count ?? 0) > 0;
  const hasStockSetup = (setupCheckRes.count ?? 0) > 0;
  const items = (inventoryRes.data as InventoryItem[]) ?? [];
  const sumPurchases = (rows: { quantity: number | null; unit_cost_price: number | null }[]) =>
    rows.reduce((sum, row) => sum + (row.quantity ?? 0) * (row.unit_cost_price ?? 0), 0);
  const monthlyPurchases = sumPurchases(purchaseRes.data ?? []);
  const totalPurchases = sumPurchases(totalPurchaseRes.data ?? []);

  return (
    <div className="space-y-4">
      <div className="animate-fade-in-up">
        <ManagementTabs />
      </div>

      {hasProducts && !hasStockSetup && (
        <div className="animate-fade-in-up animation-delay-100">
          <InventorySetupGuide />
        </div>
      )}

      <div className="animate-fade-in-up animation-delay-100">
        {!hasProducts ? (
          <EmptyState
            illustration="product"
            message="在庫管理を始めましょう"
            description="商品を登録すると、在庫数の管理や売上・仕入レポートが使えるようになります"
            action={{ label: "商品を登録する", href: "/sales/inventory/products" }}
            size="md"
          />
        ) : (
          <InventoryDashboard items={items} monthlyPurchases={monthlyPurchases} totalPurchases={totalPurchases} salonId={salon.id} />
        )}
      </div>
    </div>
  );
}
