"use client";

import { useState } from "react";
import { INPUT_CLASS, type PendingTicket } from "./types";

type Props = {
  onAdd: (ticket: PendingTicket) => void;
};

export function TicketInlineForm({ onAdd }: Props) {
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState("2");
  const [price, setPrice] = useState("");
  const [memo, setMemo] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      ticket_name: name.trim(),
      total_sessions: Math.max(1, parseInt(sessions, 10) || 1),
      price: price ? parseInt(price, 10) || null : null,
      memo,
    });
    setName("");
    setSessions("2");
    setPrice("");
    setMemo("");
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="チケット名（例: バストメイク2回券）"
        className={INPUT_CLASS}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-light mb-1">回数</label>
          <input
            type="number"
            min={1}
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
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
