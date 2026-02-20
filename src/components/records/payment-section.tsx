"use client";

import type { Menu, MenuPaymentInfo, CourseTicket } from "./types";

type Props = {
  menus: Menu[];
  selectedMenuIds: string[];
  menuPayments: MenuPaymentInfo[];
  courseTickets: CourseTicket[];
  hasTickets: boolean;
  onSetAllPaymentType: (paymentType: "cash" | "credit") => void;
  onUpdatePayment: (menuId: string, paymentType: MenuPaymentInfo["paymentType"], ticketId?: string | null) => void;
  onUpdatePrice: (menuId: string, price: number | null) => void;
  onUpdateTicket: (menuId: string, ticketId: string) => void;
  showCashTotal?: boolean;
};

export function PaymentSection({
  menus,
  selectedMenuIds,
  menuPayments,
  courseTickets,
  hasTickets,
  onSetAllPaymentType,
  onUpdatePayment,
  onUpdatePrice,
  onUpdateTicket,
  showCashTotal = false,
}: Props) {
  if (selectedMenuIds.length === 0) return null;

  const totalPrice = selectedMenuIds.reduce((sum, id) => {
    const menu = menus.find((m) => m.id === id);
    const payment = menuPayments.find((mp) => mp.menuId === id);
    return sum + (payment?.priceOverride ?? menu?.price ?? 0);
  }, 0);

  const cashTotal = selectedMenuIds.reduce((sum, id) => {
    const menu = menus.find((m) => m.id === id);
    const payment = menuPayments.find((mp) => mp.menuId === id);
    if (payment?.paymentType === "cash" || payment?.paymentType === "credit") {
      return sum + (payment?.priceOverride ?? menu?.price ?? 0);
    }
    return sum;
  }, 0);

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">支払方法</label>
      {/* 一括設定ボタン */}
      <div className="flex gap-1.5 mb-2">
        <button
          type="button"
          onClick={() => onSetAllPaymentType("cash")}
          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/5 hover:border-accent hover:text-accent transition-colors"
        >
          全て現金
        </button>
        <button
          type="button"
          onClick={() => onSetAllPaymentType("credit")}
          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/5 hover:border-accent hover:text-accent transition-colors"
        >
          全てクレジット
        </button>
      </div>
      <div className="bg-background border border-border rounded-xl p-3 space-y-2.5">
        {selectedMenuIds.map((menuId) => {
          const menu = menus.find((m) => m.id === menuId);
          const payment = menuPayments.find((mp) => mp.menuId === menuId);
          if (!menu) return null;
          return (
            <div key={menuId} className="space-y-1.5">
              <div className="text-sm font-medium truncate">{menu.name}</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={payment?.priceOverride ?? menu.price ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || val === String(menu.price ?? "")) {
                        onUpdatePrice(menuId, null);
                      } else {
                        onUpdatePrice(menuId, parseInt(val, 10) || 0);
                      }
                    }}
                    className={`w-24 text-sm text-right rounded-lg border bg-surface px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/50 ${
                      payment?.priceOverride != null ? "border-accent text-accent font-medium" : "border-border"
                    }`}
                  />
                  <span className="text-xs text-text-light">円</span>
                </div>
                <select
                  value={payment?.paymentType ?? "cash"}
                  onChange={(e) => {
                    const pt = e.target.value as MenuPaymentInfo["paymentType"];
                    onUpdatePayment(menuId, pt, pt === "ticket" && courseTickets.length === 1 ? courseTickets[0].id : null);
                  }}
                  className="text-xs rounded-lg border border-border bg-surface px-2 py-1.5 flex-1 focus:outline-none focus:ring-1 focus:ring-accent/50"
                >
                  <option value="cash">現金</option>
                  <option value="credit">クレジット</option>
                  {hasTickets && <option value="ticket">回数券</option>}
                  <option value="service">サービス（無料）</option>
                </select>
              </div>

              {/* 回数券選択: 複数チケットの場合のみ表示 */}
              {payment?.paymentType === "ticket" && courseTickets.length > 1 && (
                <select
                  value={payment.ticketId ?? ""}
                  onChange={(e) => onUpdateTicket(menuId, e.target.value)}
                  className="text-xs rounded-lg border border-border bg-surface px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-accent/50 ml-0"
                >
                  <option value="">チケットを選択...</option>
                  {courseTickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ticket_name}（残{t.total_sessions - t.used_sessions}回）
                    </option>
                  ))}
                </select>
              )}

              {/* 回数券が1つの場合: 自動選択の表示 */}
              {payment?.paymentType === "ticket" && courseTickets.length === 1 && (
                <p className="text-xs text-accent">
                  {courseTickets[0].ticket_name}（残{courseTickets[0].total_sessions - courseTickets[0].used_sessions}回）
                </p>
              )}
            </div>
          );
        })}
      </div>
      {showCashTotal && cashTotal !== totalPrice && (
        <p className="text-xs text-accent font-medium mt-1.5">
          当日お支払い: {cashTotal.toLocaleString()}円
        </p>
      )}
    </div>
  );
}
