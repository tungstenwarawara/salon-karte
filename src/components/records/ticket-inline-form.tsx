"use client";

import { useState } from "react";
import { INPUT_CLASS, type PendingTicket, type Menu } from "./types";

type Props = {
  menus?: Menu[];
  onAdd: (ticket: PendingTicket) => void;
};

export function TicketInlineForm({ menus = [], onAdd }: Props) {
  const [mode, setMode] = useState<"menu" | "free">(menus.length > 0 ? "menu" : "free");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState("2");
  const [price, setPrice] = useState("");
  const [memo, setMemo] = useState("");

  // メニュー選択時にチケット名と参考金額を自動入力
  const handleMenuChange = (menuId: string) => {
    const menu = menus.find((m) => m.id === menuId);
    setSelectedMenuId(menuId);
    if (menu) {
      setName(menu.name);
      // セッション数が既に入力済みならその値で参考金額を計算
      const currentSessions = Math.max(1, parseInt(sessions, 10) || 2);
      if (menu.price) {
        setPrice((menu.price * currentSessions).toString());
      }
    }
  };

  // 回数変更時に参考金額を再計算（メニュー選択モードの場合）
  const handleSessionsChange = (value: string) => {
    setSessions(value);
    if (mode === "menu" && selectedMenuId) {
      const menu = menus.find((m) => m.id === selectedMenuId);
      if (menu?.price) {
        const newSessions = Math.max(1, parseInt(value, 10) || 1);
        setPrice((menu.price * newSessions).toString());
      }
    }
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      ticket_name: name.trim(),
      total_sessions: Math.max(1, parseInt(sessions, 10) || 1),
      price: price ? parseInt(price, 10) || null : null,
      memo,
    });
    // フォームリセット
    setSelectedMenuId("");
    setName("");
    setSessions("2");
    setPrice("");
    setMemo("");
  };

  // メニュー選択モード時の定価参考表示
  const selectedMenu = menus.find((m) => m.id === selectedMenuId);
  const currentSessions = Math.max(1, parseInt(sessions, 10) || 1);
  const referencePrice = selectedMenu?.price ? selectedMenu.price * currentSessions : null;

  return (
    <div className="space-y-3">
      {/* モード切替（メニューがある場合のみ表示） */}
      {menus.length > 0 && (
        <div className="flex gap-1 bg-background rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => setMode("menu")}
            className={`flex-1 text-center text-xs font-medium py-2 rounded-lg transition-colors min-h-[44px] ${
              mode === "menu" ? "bg-accent text-white shadow-sm" : "text-text-light hover:text-text"
            }`}
          >
            メニューから作成
          </button>
          <button
            type="button"
            onClick={() => setMode("free")}
            className={`flex-1 text-center text-xs font-medium py-2 rounded-lg transition-colors min-h-[44px] ${
              mode === "free" ? "bg-accent text-white shadow-sm" : "text-text-light hover:text-text"
            }`}
          >
            自由入力
          </button>
        </div>
      )}

      {/* メニュー選択 or チケット名入力 */}
      {mode === "menu" ? (
        <>
          <select
            value={selectedMenuId}
            onChange={(e) => handleMenuChange(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">メニューを選択</option>
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
                {menu.category ? ` (${menu.category})` : ""}
                {menu.price ? ` - ¥${menu.price.toLocaleString()}` : ""}
              </option>
            ))}
          </select>
          {/* チケット名（メニュー名をベースに編集可能） */}
          <div>
            <label className="block text-xs text-text-light mb-1">チケット名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="メニューを選択すると自動入力されます"
              className={INPUT_CLASS}
            />
          </div>
        </>
      ) : (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="チケット名（例: バストメイク2回券）"
          className={INPUT_CLASS}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-light mb-1">回数</label>
          <input
            type="number"
            min={1}
            value={sessions}
            onChange={(e) => handleSessionsChange(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-xs text-text-light mb-1">金額（円）</label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* 定価参考表示（メニュー選択時のみ） */}
      {mode === "menu" && referencePrice != null && (
        <div className="flex items-center justify-between bg-background rounded-xl px-3 py-2">
          <span className="text-xs text-text-light">定価参考</span>
          <span className="text-xs text-text-light">
            ¥{(selectedMenu?.price ?? 0).toLocaleString()} × {currentSessions}回 = ¥{referencePrice.toLocaleString()}
          </span>
        </div>
      )}

      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="メモ（任意）"
        className={INPUT_CLASS}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!name.trim()}
        className="w-full bg-accent/10 text-accent text-sm font-medium rounded-xl py-2.5 hover:bg-accent/20 transition-colors disabled:opacity-50 min-h-[44px]"
      >
        + 回数券を追加
      </button>
    </div>
  );
}
