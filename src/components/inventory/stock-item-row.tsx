"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { InventoryItem } from "./inventory-dashboard";

type LogEntry = {
  id: string;
  log_type: string;
  quantity: number;
  unit_cost_price: number | null;
  reason: string | null;
  logged_at: string;
  created_at: string;
};

const LOG_TYPE_LABELS: Record<string, string> = {
  purchase_in: "仕入入庫",
  sale_out: "物販出庫",
  sample_out: "サンプル消費",
  waste_out: "廃棄",
  adjust: "棚卸調整",
  return_in: "返品入庫",
};

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

type Props = {
  item: InventoryItem;
  salonId: string;
  onStockChanged?: () => void;
};

export function StockItemRow({ item, salonId, onStockChanged }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [quickConsumeLoading, setQuickConsumeLoading] = useState(false);
  const [localStock, setLocalStock] = useState(item.current_stock);

  const isLow = localStock <= item.reorder_point;

  const handleToggle = async () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    // 初回展開時にログを取得
    if (nextExpanded && logs === null) {
      setLogsLoading(true);
      const supabase = createClient();
      const { data } = await supabase.rpc("get_product_inventory_logs", {
        p_salon_id: salonId,
        p_product_id: item.product_id,
        p_limit: 10,
      });
      setLogs((data as LogEntry[]) ?? []);
      setLogsLoading(false);
    }
  };

  const handleQuickConsume = async () => {
    if (localStock <= 0) return;
    setQuickConsumeLoading(true);

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const supabase = createClient();
    const { error } = await supabase.from("inventory_logs").insert({
      salon_id: salonId,
      product_id: item.product_id,
      log_type: "sample_out",
      quantity: -1,
      logged_at: dateStr,
    });

    if (error) {
      console.error("クイック消費エラー:", error.message);
      setQuickConsumeLoading(false);
      return;
    }

    // ローカル在庫を更新
    setLocalStock((prev) => prev - 1);

    // ログを再取得
    const { data } = await supabase.rpc("get_product_inventory_logs", {
      p_salon_id: salonId,
      p_product_id: item.product_id,
      p_limit: 10,
    });
    setLogs((data as LogEntry[]) ?? []);

    setQuickConsumeLoading(false);
    onStockChanged?.();
  };

  return (
    <div
      className={`rounded-xl transition-colors ${
        isLow ? "bg-amber-50 border border-amber-200" : "bg-surface border border-border"
      }`}
    >
      {/* メイン行（タップで展開） */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 min-h-[48px] text-left"
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
              {localStock}個
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-4 h-4 text-text-light transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {/* 展開エリア */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="border-t border-border pt-2" />

          {/* クイック消費ボタン */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light">サンプル消費</span>
            <button
              onClick={handleQuickConsume}
              disabled={localStock <= 0 || quickConsumeLoading}
              className="text-xs bg-background border border-border px-3 py-1.5 rounded-lg min-h-[44px] flex items-center gap-1 hover:bg-border/30 transition-colors disabled:opacity-50"
            >
              {quickConsumeLoading ? "処理中..." : "-1 消費"}
            </button>
          </div>

          {/* 入出庫履歴 */}
          <div className="space-y-1">
            <p className="text-xs text-text-light font-medium">入出庫履歴</p>
            {logsLoading ? (
              <div className="flex justify-center py-2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-text-light shrink-0">{formatDateShort(log.logged_at)}</span>
                    <span className={`truncate ${log.quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                      {LOG_TYPE_LABELS[log.log_type] ?? log.log_type}
                    </span>
                  </div>
                  <span className={`font-bold shrink-0 ml-2 ${log.quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                    {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-light text-center py-1">履歴なし</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
