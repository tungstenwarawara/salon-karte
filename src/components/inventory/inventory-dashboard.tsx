"use client";

import { useState } from "react";
import Link from "next/link";
import { StockItemRow } from "./stock-item-row";

export type InventoryItem = {
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

type SortKey = "name" | "low_stock";

type Props = {
  items: InventoryItem[];
  monthlyPurchases: number;
  totalPurchases: number;
  salonId: string;
};

const quickActions = [
  { href: "/sales/inventory/receive", label: "仕入記録", icon: "📦" },
  { href: "/sales/inventory/consume", label: "消費・廃棄", icon: "📋" },
  { href: "/sales/inventory/stocktake", label: "棚卸し", icon: "📊" },
  { href: "/sales/inventory/tax-report", label: "確定申告", icon: "📄" },
];

export function InventoryDashboard({ items, monthlyPurchases, totalPurchases, salonId }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");

  const lowStockItems = items.filter((i) => i.current_stock <= i.reorder_point);
  const totalStockValue = items.reduce((sum, i) => sum + (i.stock_value > 0 ? i.stock_value : 0), 0);

  // 検索フィルタ
  const filtered = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.product_name.toLowerCase().includes(s) ||
      (item.category ?? "").toLowerCase().includes(s)
    );
  });

  // ソート
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "low_stock") {
      const aGap = a.current_stock - a.reorder_point;
      const bGap = b.current_stock - b.reorder_point;
      return aGap - bGap;
    }
    return a.product_name.localeCompare(b.product_name, "ja");
  });

  return (
    <>
      {/* 要発注アラート */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
          <p className="text-sm font-medium text-amber-800">
            要発注: {lowStockItems.length}商品
          </p>
          {lowStockItems.map((item) => (
            <div key={item.product_id} className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">
                  {item.product_name}（残 {item.current_stock}個）
                </span>
              </div>
              <Link
                href={`/sales/inventory/receive?product=${item.product_id}`}
                className="shrink-0 text-xs bg-accent text-white px-3 py-1.5 rounded-lg min-h-[44px] flex items-center transition-colors hover:bg-accent-light"
              >
                仕入れる
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-light">商品数</p>
          <p className="text-xl font-bold mt-1">{items.length}</p>
        </div>
        <div className={`bg-surface border rounded-xl p-4 text-center ${lowStockItems.length > 0 ? "border-amber-300 bg-amber-50" : "border-border"}`}>
          <p className="text-xs text-text-light">要発注</p>
          <p className={`text-xl font-bold mt-1 ${lowStockItems.length > 0 ? "text-amber-600" : ""}`}>
            {lowStockItems.length}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-light">今月の仕入額</p>
          <p className="text-lg font-bold mt-1">¥{monthlyPurchases.toLocaleString()}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-light">累計仕入額</p>
          <p className="text-lg font-bold mt-1">¥{totalPurchases.toLocaleString()}</p>
          <p className="text-[10px] text-text-light mt-1">仕入れに使った合計金額</p>
        </div>
        <div className="col-span-2 bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-light">在庫評価額</p>
          <p className="text-lg font-bold mt-1">¥{totalStockValue.toLocaleString()}</p>
          <p className="text-[10px] text-text-light mt-1">今ある在庫の価値（確定申告用・商品マスタの仕入単価で計算）</p>
        </div>
      </div>

      {/* クイックアクション */}
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

      {/* 在庫一覧 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">在庫一覧</h3>
          <Link
            href="/sales/inventory/products"
            className="text-xs text-accent hover:underline"
          >
            商品マスタ →
          </Link>
        </div>

        {/* 検索 */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="商品名・カテゴリで検索"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text p-1"
              aria-label="検索をクリア"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ソート */}
        <div className="flex gap-2">
          {([
            ["name", "名前順"],
            ["low_stock", "在庫少ない順"],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors min-h-[44px] ${
                sortBy === key
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-text-light"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* リスト */}
        {sorted.length > 0 ? (
          <div className="space-y-2">
            {sorted.map((item) => (
              <StockItemRow key={item.product_id} item={item} salonId={salonId} />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            {search ? (
              <p className="text-text-light text-sm">該当する商品が見つかりません</p>
            ) : (
              <p className="text-text-light text-sm">在庫データがありません</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
