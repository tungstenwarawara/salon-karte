"use client";

import { useState } from "react";

/** プリセットメニュー1件の型 */
export type PresetMenu = {
  name: string;
  duration: number;
  price: number;
  category: string;
};

/** 業種ごとのプリセット定義 */
const INDUSTRY_PRESETS: Record<
  string,
  { label: string; menus: PresetMenu[] }
> = {
  esthe: {
    label: "エステ",
    menus: [
      { name: "フェイシャル基本コース", duration: 60, price: 8000, category: "フェイシャル" },
      { name: "ボディトリートメント", duration: 90, price: 12000, category: "ボディ" },
      { name: "小顔マッサージ", duration: 30, price: 5000, category: "フェイシャル" },
    ],
  },
  nail: {
    label: "ネイル",
    menus: [
      { name: "ジェルネイル", duration: 90, price: 7000, category: "ネイル" },
      { name: "ネイルケア", duration: 30, price: 3000, category: "ネイル" },
      { name: "オフ＋付け替え", duration: 120, price: 9000, category: "ネイル" },
    ],
  },
  eyelash: {
    label: "まつエク",
    menus: [
      { name: "シングルラッシュ 120本", duration: 90, price: 6000, category: "まつ毛" },
      { name: "ボリュームラッシュ", duration: 120, price: 8000, category: "まつ毛" },
      { name: "オフのみ", duration: 30, price: 2000, category: "まつ毛" },
    ],
  },
  relaxation: {
    label: "リラクゼーション",
    menus: [
      { name: "全身もみほぐし 60分", duration: 60, price: 6000, category: "リラクゼーション" },
      { name: "ヘッドスパ", duration: 40, price: 4000, category: "ヘッドスパ" },
      { name: "足つぼ＋ふくらはぎ", duration: 30, price: 3500, category: "リラクゼーション" },
    ],
  },
  hair: {
    label: "ヘアサロン",
    menus: [
      { name: "カット", duration: 60, price: 5000, category: "その他" },
      { name: "カラー", duration: 90, price: 8000, category: "その他" },
      { name: "カット＋カラー", duration: 120, price: 12000, category: "その他" },
    ],
  },
};

/** 業種一覧（表示順） + 「その他」 */
const INDUSTRIES = Object.entries(INDUSTRY_PRESETS);

type Props = {
  onNext: (menus: PresetMenu[]) => void;
  onSkip: () => void;
};

export function StepMenuPresets({ onNext, onSkip }: Props) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [checkedMenus, setCheckedMenus] = useState<Record<number, boolean>>({});
  // 「その他」業種の自由入力
  const [customName, setCustomName] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const handleSelectIndustry = (key: string) => {
    setSelectedIndustry(key);
    const menus = INDUSTRY_PRESETS[key].menus;
    const all: Record<number, boolean> = {};
    menus.forEach((_, i) => { all[i] = true; });
    setCheckedMenus(all);
  };

  const handleSelectOther = () => {
    setSelectedIndustry("other");
  };

  const toggleMenu = (index: number) => {
    setCheckedMenus((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // プリセット確定
  const handleConfirm = () => {
    if (!selectedIndustry || selectedIndustry === "other") return;
    const menus = INDUSTRY_PRESETS[selectedIndustry].menus;
    const selected = menus.filter((_, i) => checkedMenus[i]);
    onNext(selected);
  };

  // 自由入力確定
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onNext([{
      name: customName.trim(),
      duration: customDuration ? parseInt(customDuration, 10) || 0 : 0,
      price: customPrice ? parseInt(customPrice, 10) || 0 : 0,
      category: "その他",
    }]);
  };

  const selectedCount = Object.values(checkedMenus).filter(Boolean).length;
  const presetMenus = selectedIndustry && selectedIndustry !== "other"
    ? INDUSTRY_PRESETS[selectedIndustry].menus
    : [];

  // --- 業種選択画面 ---
  if (!selectedIndustry) {
    return (
      <div className="space-y-5 animate-slide-in-right">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold">サロンの業種を選択</h2>
          <p className="text-sm text-text-light">
            業種に合ったメニューを自動で登録できます
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
            onClick={handleSelectOther}
            className="bg-background hover:bg-accent/5 border border-border hover:border-accent rounded-xl p-4 text-center transition-colors min-h-[56px] font-medium text-sm text-text-light"
          >
            その他
          </button>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="w-full text-sm text-text-light hover:text-accent transition-colors py-2 min-h-[44px]"
        >
          スキップ（あとで設定画面から登録できます）
        </button>
      </div>
    );
  }

  // --- 「その他」業種: 自由入力フォーム ---
  if (selectedIndustry === "other") {
    return (
      <form onSubmit={handleCustomSubmit} className="space-y-5 animate-slide-in-right">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold">メニューを登録</h2>
          <p className="text-sm text-text-light">
            よく施術するメニューを1つ登録しましょう
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="setup-custom-name" className="block text-sm font-medium mb-1.5">
              メニュー名 <span className="text-error text-xs">必須</span>
            </label>
            <input
              id="setup-custom-name"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              required
              placeholder="例: カット＆カラー"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="setup-custom-duration" className="block text-sm font-medium mb-1.5">
                所要時間 <span className="text-xs text-text-light">任意</span>
              </label>
              <div className="relative">
                <input
                  id="setup-custom-duration"
                  type="number"
                  inputMode="numeric"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="60"
                  min={1}
                  className="w-full rounded-xl border border-border bg-background pl-4 pr-8 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-light">分</span>
              </div>
            </div>

            <div>
              <label htmlFor="setup-custom-price" className="block text-sm font-medium mb-1.5">
                料金 <span className="text-xs text-text-light">任意</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-light">¥</span>
                <input
                  id="setup-custom-price"
                  type="number"
                  inputMode="numeric"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
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
            disabled={!customName.trim()}
            className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-40 min-h-[48px]"
          >
            登録して次へ
          </button>
          <button
            type="button"
            onClick={() => { setSelectedIndustry(null); }}
            className="w-full text-sm text-text-light hover:text-accent transition-colors py-2 min-h-[44px]"
          >
            業種を選びなおす
          </button>
        </div>
      </form>
    );
  }

  // --- プリセットメニュー確認画面 ---
  return (
    <div className="space-y-5 animate-slide-in-right">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold">メニューを確認</h2>
        <p className="text-sm text-text-light">
          不要なメニューはチェックを外してください
        </p>
      </div>

      <div className="space-y-2">
        {presetMenus.map((menu, i) => (
          <label
            key={i}
            className={`flex items-start gap-3 rounded-xl p-3 transition-colors cursor-pointer ${
              checkedMenus[i] ? "bg-accent/5 border border-accent/30" : "bg-background border border-border"
            }`}
          >
            <input
              type="checkbox"
              checked={!!checkedMenus[i]}
              onChange={() => toggleMenu(i)}
              className="mt-0.5 w-5 h-5 rounded accent-accent shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{menu.name}</p>
              <p className="text-xs text-text-light">
                {menu.duration}分 / {menu.price.toLocaleString()}円
              </p>
            </div>
          </label>
        ))}
      </div>

      <p className="text-xs text-text-light text-center">
        メニュー名・料金は設定画面からいつでも編集・追加できます
      </p>

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selectedCount === 0}
          className="w-full bg-accent hover:bg-accent-light text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-40 min-h-[48px]"
        >
          {selectedCount > 0 ? `${selectedCount}件のメニューを登録` : "メニューを選択してください"}
        </button>
        <button
          type="button"
          onClick={() => { setSelectedIndustry(null); setCheckedMenus({}); }}
          className="w-full text-sm text-text-light hover:text-accent transition-colors py-2 min-h-[44px]"
        >
          業種を選びなおす
        </button>
      </div>
    </div>
  );
}
