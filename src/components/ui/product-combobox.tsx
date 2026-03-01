"use client";

import { useState, useRef, useEffect } from "react";

type Product = {
  id: string;
  name: string;
  category: string | null;
  base_sell_price?: number;
  base_cost_price?: number;
};

type Props = {
  products: Product[];
  selectedId: string;
  onSelect: (id: string) => void;
  showPrice?: "sell" | "cost" | false;
  className?: string;
  required?: boolean;
};

export function ProductCombobox({ products, selectedId, onSelect, showPrice = false, className = "", required }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === selectedId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = search
    ? products.filter((p) => {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q);
      })
    : products;

  const formatPrice = (product: Product) => {
    if (showPrice === "sell" && product.base_sell_price != null) {
      return ` - ¥${product.base_sell_price.toLocaleString()}`;
    }
    if (showPrice === "cost" && product.base_cost_price != null) {
      return ` - ¥${product.base_cost_price.toLocaleString()}`;
    }
    return "";
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setSearch("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 選択済み表示 or 検索入力 */}
      {selectedProduct && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
        >
          <span>{selectedProduct.name}</span>
          {selectedProduct.category && <span className="text-text-light"> ({selectedProduct.category})</span>}
          <span className="text-text-light">{formatPrice(selectedProduct)}</span>
        </button>
      ) : (
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="商品名で検索..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
        />
      )}
      {/* hidden input for form validation */}
      {required && <input type="hidden" value={selectedId} required />}

      {/* ドロップダウン */}
      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p.id)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors min-h-[44px] ${
                  selectedId === p.id
                    ? "bg-accent/10 text-accent font-medium"
                    : "hover:bg-background"
                }`}
              >
                <span>{p.name}</span>
                {p.category && <span className="text-text-light"> ({p.category})</span>}
                <span className="text-text-light">{formatPrice(p)}</span>
              </button>
            ))
          ) : (
            <p className="text-sm text-text-light text-center py-3">該当する商品がありません</p>
          )}
        </div>
      )}
    </div>
  );
}
