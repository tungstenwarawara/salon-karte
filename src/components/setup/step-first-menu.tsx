"use client";

import { useState } from "react";
import { EmptyStateIllustration } from "@/components/ui/empty-state-illustrations";
import { MENU_PRESETS, type BusinessType } from "@/lib/menu-presets";

type MenuData = { name: string; duration: number | null; price: number | null };

export function StepFirstMenu({
  onNext,
  onSkip,
  initial,
  businessType,
}: {
  onNext: (data: MenuData) => void;
  onSkip: () => void;
  initial?: { name: string; duration: number | null; price: number | null };
  businessType: BusinessType | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [duration, setDuration] = useState(initial?.duration != null ? String(initial.duration) : "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");

  const presets = businessType ? MENU_PRESETS[businessType] : [];

  const applyPreset = (preset: typeof presets[number]) => {
    setName(preset.name);
    setDuration(String(preset.duration));
    setPrice(String(preset.price));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onNext({
      name: name.trim(),
      duration: duration ? parseInt(duration, 10) || null : null,
      price: price ? parseInt(price, 10) || null : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-slide-in-right">
      <div className="text-center space-y-2">
        <EmptyStateIllustration type="product" size="sm" />
        <h2 className="text-lg font-bold">メニューを登録</h2>
        <p className="text-sm text-text-light">
          よく施術するメニューを1つ登録しましょう
        </p>
      </div>

      {presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-light">候補から選ぶ（タップで入力）</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium rounded-full px-3 py-2 transition-colors min-h-[36px]"
              >
                {preset.name}（{preset.duration}分 / {preset.price.toLocaleString()}円）
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="setup-menu-name" className="block text-sm font-medium mb-1.5">
            メニュー名 <span className="text-error text-xs">必須</span>
          </label>
          <input
            id="setup-menu-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="例: カット＆カラー"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="setup-menu-duration" className="block text-sm font-medium mb-1.5">
              所要時間 <span className="text-xs text-text-light">任意</span>
            </label>
            <div className="relative">
              <input
                id="setup-menu-duration"
                type="number"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                min={1}
                className="w-full rounded-xl border border-border bg-background pl-4 pr-8 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-light">分</span>
            </div>
          </div>

          <div>
            <label htmlFor="setup-menu-price" className="block text-sm font-medium mb-1.5">
              料金 <span className="text-xs text-text-light">任意</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-light">¥</span>
              <input
                id="setup-menu-price"
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5,000"
                min={0}
                className="w-full rounded-xl border border-border bg-background pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-40 min-h-[48px]"
        >
          完了
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-sm text-text-light hover:text-accent transition-colors py-2 min-h-[44px]"
        >
          スキップ（あとで登録）
        </button>
      </div>
    </form>
  );
}
