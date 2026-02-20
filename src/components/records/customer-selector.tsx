"use client";

import { useState } from "react";
import { INPUT_CLASS, type CustomerOption } from "./types";

type Props = {
  customers: CustomerOption[];
  selectedCustomerId: string;
  customerName: string;
  onSelect: (id: string, name: string) => void;
};

export function CustomerSelector({ customers, selectedCustomerId, customerName, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? customers.filter((c) => {
        const fullName = `${c.last_name}${c.first_name}`;
        const fullKana = `${c.last_name_kana ?? ""}${c.first_name_kana ?? ""}`;
        const q = search.toLowerCase();
        return fullName.includes(q) || fullKana.includes(q);
      })
    : customers;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <label className="block text-sm font-bold">
        顧客を選択 <span className="text-error">*</span>
      </label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="名前・カナで検索..."
        className={INPUT_CLASS}
      />
      {customers.length === 0 ? (
        <p className="text-sm text-text-light text-center py-2">
          顧客が登録されていません
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(c.id, `${c.last_name} ${c.first_name}`);
                setSearch("");
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                selectedCustomerId === c.id
                  ? "bg-accent/10 border border-accent text-accent font-medium"
                  : "hover:bg-background border border-transparent"
              }`}
            >
              <span>{c.last_name} {c.first_name}</span>
              {c.last_name_kana && (
                <span className="text-xs text-text-light ml-2">
                  {c.last_name_kana} {c.first_name_kana}
                </span>
              )}
            </button>
          ))}
          {filtered.length === 0 && search && (
            <p className="text-sm text-text-light text-center py-2">
              該当する顧客がいません
            </p>
          )}
        </div>
      )}
      {selectedCustomerId && customerName && (
        <div className="flex items-center gap-2 bg-accent/5 rounded-xl px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-accent shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span className="text-sm font-medium">{customerName}</span>
        </div>
      )}
    </div>
  );
}
