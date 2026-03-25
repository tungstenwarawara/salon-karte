"use client";

import { useState } from "react";

/** プリセットメニュー1件の型 */
export type PresetMenu = {
  name: string;
  duration: number;
  price: number;
  category: string;
};

/** 業種ごとの代表メニュー（プレフィル用） */
const INDUSTRY_DEFAULTS: Record<
  string,
  { label: string; suggestion: PresetMenu; placeholder: string }
> = {
  esthe: {
    label: "エステ",
    suggestion: { name: "フェイシャル基本コース", duration: 60, price: 8000, category: "フェイシャル" },
    placeholder: "例: フェイシャル基本コース",
  },
  nail: {
    label: "ネイル",
    suggestion: { name: "ジェルネイル", duration: 90, price: 7000, category: "ネイル" },
    placeholder: "例: ジェルネイル",
  },
  eyelash: {
    label: "まつエク",
    suggestion: { name: "シングルラッシュ 120本", duration: 90, price: 6000, category: "まつ毛" },
    placeholder: "例: シングルラッシュ 120本",
  },
  relaxation: {
    label: "リラクゼーション",
    suggestion: { name: "全身もみほぐし 60分", duration: 60, price: 6000, category: "リラクゼーション" },
    placeholder: "例: 全身もみほぐし 60分",
  },
  hair: {
    label: "ヘアサロン",
    suggestion: { name: "カット", duration: 60, price: 5000, category: "カット" },
    placeholder: "例: カット",
  },
};

/** 業種一覧（表示順） */
const INDUSTRIES = Object.entries(INDUSTRY_DEFAULTS);

type Props = {
  onNext: (menus: PresetMenu[]) => void;
};

export function StepMenuPresets({ onNext }: Props) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  // メニューフォームの値
  const [menuName, setMenuName] = useState("");
  const [menuDuration, setMenuDuration] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuCategory, setMenuCategory] = useState("その他");

  const handleSelectIndustry = (key: string) => {
    setSelectedIndustry(key);
    if (key !== "other") {
      const { suggestion } = INDUSTRY_DEFAULTS[key];
      setMenuName(suggestion.name);
      setMenuDuration(String(suggestion.duration));
      setMenuPrice(String(suggestion.price));
      setMenuCategory(suggestion.category);
    } else {
      setMenuName("");
      setMenuDuration("");
      setMenuPrice("");
      setMenuCategory("その他");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim()) return;
    onNext([{
      name: menuName.trim(),
      duration: menuDuration ? parseInt(menuDuration, 10) || 0 : 0,
      price: menuPrice ? parseInt(menuPrice, 10) || 0 : 0,
      category: menuCategory,
    }]);
  };

  const handleBack = () => {
    setSelectedIndustry(null);
    setMenuName("");
    setMenuDuration("");
    setMenuPrice("");
    setMenuCategory("その他");
  };

  const placeholder = selectedIndustry && selectedIndustry !== "other"
    ? INDUSTRY_DEFAULTS[selectedIndustry].placeholder
    : "例: カット＆カラー";

  const industryLabel = selectedIndustry && selectedIndustry !== "other"
    ? INDUSTRY_DEFAULTS[selectedIndustry].label
    : null;

  // --- 業種選択画面 ---
  if (!selectedIndustry) {
    return (
      <div className="space-y-5 animate-slide-in-right">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold">サロンの業種を選択</h2>
          <p className="text-sm text-text-light">
            業種に合わせてメニューの入力例を表示します
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {INDUSTRIES.map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectIndustry(key)}
              className="bg-background hover:bg-accent/5 border border-border hover:border-accent rounded-xl p-4 text-center transition-colors min-h-[56px] font-medium text-sm"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleSelectIndustry("other")}
            className="bg-background hover:bg-accent/5 border border-border hover:border-accent rounded-xl p-4 text-center transition-colors min-h-[56px] font-medium text-sm text-text-light"
          >
            その他
          </button>
        </div>
      </div>
    );
  }

  // --- メニュー登録フォーム（業種共通、プレフィルの有無が違うだけ）---
  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-slide-in-right">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold">一番人気のメニューを登録</h2>
        <p className="text-sm text-text-light">
          {industryLabel
            ? `${industryLabel}のよくあるメニューを入力済みです。あなたのサロンに合わせて変更してください`
            : "よく施術するメニューを1つ登録しましょう"}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="setup-menu-name" className="block text-sm font-medium mb-1.5">
            メニュー名 <span className="text-error text-xs">必須</span>
          </label>
          <input
            id="setup-menu-name"
            type="text"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            required
            placeholder={placeholder}
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
                value={menuDuration}
                onChange={(e) => setMenuDuration(e.target.value)}
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
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
                placeholder="5,000"
                min={0}
                className="w-full rounded-xl border border-border bg-background pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-text-light text-center">
        残りのメニューは設定画面からいつでも追加できます
      </p>

      <div className="space-y-2">
        <button
          type="submit"
          disabled={!menuName.trim()}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-40 min-h-[48px]"
        >
          登録して次へ
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="w-full text-sm text-text-light hover:text-accent transition-colors py-2 min-h-[44px]"
        >
          業種を選びなおす
        </button>
      </div>
    </form>
  );
}
