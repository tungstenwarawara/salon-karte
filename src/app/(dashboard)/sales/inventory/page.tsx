"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ManagementTabs } from "@/components/inventory/management-tabs";

type InventoryItem = {
  product_id: string;
  product_name: string;
  category: string | null;
  base_sell_price: number;
  base_cost_price: number;
  reorder_point: number;
  is_active: boolean;
  current_stock: number;
  stock_value: number;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProducts, setHasProducts] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single<{ id: string }>();
    if (!salon) return;

    // 商品数を先にチェック（コスト最小）
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id);

    if (!count || count === 0) {
      setHasProducts(false);
      setLoading(false);
      return;
    }

    setHasProducts(true);

    const { data } = await supabase.rpc("get_inventory_summary", {
      p_salon_id: salon.id,
    });

    setItems((data as InventoryItem[]) ?? []);
    setLoading(false);
  };

  const totalProducts = items.length;
  const lowStockCount = items.filter((i) => i.current_stock <= i.reorder_point).length;
  const totalStockValue = items.reduce((sum, i) => sum + (i.stock_value > 0 ? i.stock_value : 0), 0);

  const quickActions = [
    { href: "/sales/inventory/receive", label: "仕入記録", icon: "📦" },
    { href: "/sales/inventory/consume", label: "消費・廃棄", icon: "📋" },
    { href: "/sales/inventory/stocktake", label: "棚卸し", icon: "📊" },
    { href: "/sales/inventory/tax-report", label: "確定申告", icon: "📄" },
  ];

  return (
    <div className="space-y-4">
      <ManagementTabs />

      {loading ? (
        /* Skeleton */
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-border rounded w-12 mb-2" />
                <div className="h-6 bg-border rounded w-8" />
              </div>
            ))}
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-border rounded w-24 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-border rounded" />
              ))}
            </div>
          </div>
        </div>
      ) : !hasProducts ? (
        /* Onboarding */
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
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-text-light">商品数</p>
              <p className="text-xl font-bold mt-1">{totalProducts}</p>
            </div>
            <div className={`bg-surface border rounded-xl p-4 text-center ${lowStockCount > 0 ? "border-amber-300 bg-amber-50" : "border-border"}`}>
              <p className="text-xs text-text-light">要発注</p>
              <p className={`text-xl font-bold mt-1 ${lowStockCount > 0 ? "text-amber-600" : ""}`}>
                {lowStockCount}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-text-light">在庫評価額</p>
              <p className="text-lg font-bold mt-1">¥{totalStockValue.toLocaleString()}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-background transition-colors min-h-[56px]"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>

          {/* Product stock list */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">在庫一覧</h3>
              <Link
                href="/sales/inventory/products"
                className="text-xs text-accent hover:underline"
              >
                商品マスタ →
              </Link>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const isLow = item.current_stock <= item.reorder_point;
                return (
                  <div
                    key={item.product_id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${
                      isLow ? "bg-amber-50 border border-amber-200" : "bg-background"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product_name}</p>
                      {item.category && (
                        <p className="text-xs text-text-light">{item.category}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isLow ? "text-amber-600" : ""}`}>
                          {item.current_stock}個
                        </p>
                        <p className="text-[10px] text-text-light">
                          発注点 {item.reorder_point}
                        </p>
                      </div>
                      {isLow && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                          要発注
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
