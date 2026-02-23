import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";
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

  // 商品数・在庫サマリー・今月の仕入額・セットアップ状態を並列取得
  const [countRes, inventoryRes, purchaseRes, setupCheckRes] = await Promise.all([
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
  const monthlyPurchases = (purchaseRes.data ?? []).reduce(
    (sum, row) => sum + (row.quantity ?? 0) * (row.unit_cost_price ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      <ManagementTabs />

      {hasProducts && !hasStockSetup && <InventorySetupGuide />}

      {!hasProducts ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">📦</div>
          <h3 className="text-lg font-bold">在庫管理を始めましょう</h3>
          <p className="text-sm text-text-light">
            商品を登録すると、在庫数の管理や<br />
            確定申告用のレポートが使えるようになります
          </p>
          <Link
            href="/sales/inventory/products"
            className="inline-block bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-3 transition-colors min-h-[48px]"
          >
            商品を登録する
          </Link>
        </div>
      ) : (
        <InventoryDashboard items={items} monthlyPurchases={monthlyPurchases} salonId={salon.id} />
      )}
    </div>
  );
}
