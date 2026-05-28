"use client";

import { useState } from "react";
import { EmptyStateIllustration } from "@/components/ui/empty-state-illustrations";
import { BUSINESS_TYPES, type BusinessType } from "@/lib/menu-presets";

type SalonInfoData = { name: string; phone: string; address: string; businessType: BusinessType };

export function StepSalonInfo({
  onNext,
  initial,
}: {
  onNext: (data: SalonInfoData) => void;
  initial?: SalonInfoData;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [businessType, setBusinessType] = useState<BusinessType | "">(initial?.businessType ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !businessType) return;
    onNext({ name: name.trim(), phone: phone.trim(), address: address.trim(), businessType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
      <div className="text-center space-y-2">
        <EmptyStateIllustration type="clipboard" size="sm" />
        <h2 className="text-lg font-bold">サロン情報を入力</h2>
        <p className="text-sm text-text-light">まずはサロンの基本情報を教えてください</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="setup-name" className="block text-sm font-medium mb-1.5">
            サロン名 <span className="text-error text-xs">必須</span>
          </label>
          <input
            id="setup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="例: Beauty Salon Hana"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="setup-phone" className="block text-sm font-medium mb-1.5">
            電話番号 <span className="text-xs text-text-light">任意</span>
          </label>
          <input
            id="setup-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="例: 03-1234-5678"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="setup-address" className="block text-sm font-medium mb-1.5">
            住所 <span className="text-xs text-text-light">任意</span>
          </label>
          <input
            id="setup-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="例: 東京都渋谷区..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            業種 <span className="text-error text-xs">必須</span>
          </label>
          <p className="text-xs text-text-light mb-2">次のステップでこの業種に合わせたメニュー候補が表示されます</p>
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBusinessType(opt.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  businessType === opt.value
                    ? "bg-accent border-accent text-white"
                    : "bg-background border-border text-text hover:border-accent/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!name.trim() || !businessType}
        className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-40 min-h-[48px]"
      >
        次へ
      </button>
    </form>
  );
}
