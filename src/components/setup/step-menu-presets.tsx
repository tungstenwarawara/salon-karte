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

const INDUSTRIES = Object.entries(INDUSTRY_PRESETS);

type Props = {
  onNext: (menus: PresetMenu[]) => void;
  onSkip: () => void;
};

export function StepMenuPresets({ onNext, onSkip }: Props) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [checkedMenus, setCheckedMenus] = useState<Record<number, boolean>>({});

  // 業種選択時にプリセットメニューを全てONにする
  const handleSelectIndustry = (key: string) => {
    setSelectedIndustry(key);
    const menus = INDUSTRY_PRESETS[key].menus;
    const all: Record<number, boolean> = {};
    menus.forEach((_, i) => { all[i] = true; });
    setCheckedMenus(all);
  };

  const toggleMenu = (index: number) => {
    setCheckedMenus((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleConfirm = () => {
    if (!selectedIndustry) return;
    const menus = INDUSTRY_PRESETS[selectedIndustry].menus;
    const selected = menus.filter((_, i) => checkedMenus[i]);
    onNext(selected);
  };

  const selectedCount = Object.values(checkedMenus).filter(Boolean).length;
  const presetMenus = selectedIndustry ? INDUSTRY_PRESETS[selectedIndustry].menus : [];

  // 業種選択画面
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
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="w-full text-sm text-text-light hover:text-accent transition-colors py-2 min-h-[44px]"
        >
          スキップ（あとで自分で登録）
        </button>
      </div>
    );
  }

  // プリセットメニュー確認画面
  return (
    <div className="space-y-5 animate-slide-in-right">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold">メニューを確認</h2>
        <p className="text-sm text-text-light">
          不要なメニューはチェックを外してください。あとから編集・追加できます
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
