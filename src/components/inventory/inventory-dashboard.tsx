"use client";

import { useState, type ReactNode } from "react";
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

const quickActions: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/sales/inventory/receive",
    label: "仕入記録",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-accent">
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  {
    href: "/sales/inventory/consume",
    label: "消費・廃棄",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-accent">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
  },
  {
    href: "/sales/inventory/stocktake",
    label: "棚卸し",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-accent">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    href: "/sales/inventory/tax-report",
    label: "確定申告",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-accent">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
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
    <div className="space-y-4">
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
        <div className="bg-surface border border-border rounded-xl p-4 text-center shadow-card">
          <p className="text-xs text-text-light">商品数</p>
          <p className="text-xl font-bold mt-1">{items.length}</p>
        </div>
        <div className={`bg-surface border rounded-xl p-4 text-center shadow-card ${lowStockItems.length > 0 ? "border-amber-300 bg-amber-50" : "border-border"}`}>
          <p className="text-xs text-text-light">要発注</p>
          <p className={`text-xl font-bold mt-1 ${lowStockItems.length > 0 ? "text-amber-600" : ""}`}>
            {lowStockItems.length}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center shadow-card">
          <p className="text-xs text-text-light">今月の仕入額</p>
          <p className="text-lg font-bold mt-1">¥{monthlyPurchases.toLocaleString()}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center shadow-card">
          <p className="text-xs text-text-light">累計仕入額</p>
          <p className="text-lg font-bold mt-1">¥{totalPurchases.toLocaleString()}</p>
          <p className="text-[10px] text-text-light mt-1">仕入れに使った合計金額</p>
        </div>
        <div className="col-span-2 bg-surface border border-accent/20 rounded-xl p-4 text-center shadow-card">
          <p className="text-xs text-text-light">在庫評価額</p>
          <p className="text-xl font-bold mt-1 text-accent">¥{totalStockValue.toLocaleString()}</p>
          <p className="text-[10px] text-text-light mt-1">今ある在庫の価値（確定申告用・商品マスタの仕入単価で計算）</p>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-background hover:border-accent/30 transition-all min-h-[56px] shadow-card"
          >
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              {action.icon}
            </div>
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
    </div>
  );
}
