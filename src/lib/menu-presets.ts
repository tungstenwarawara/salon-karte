// 業種別のメニュープリセット定義
// セットアップ Step3（StepFirstMenu）でワンタップ入力するためのテンプレート

export type BusinessType = "esthetic" | "eyelash" | "nail" | "hair" | "bodycare" | "other";

export type MenuPreset = {
  name: string;
  duration: number; // 分
  price: number; // 円
};

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "esthetic", label: "エステ" },
  { value: "eyelash", label: "まつ毛" },
  { value: "nail", label: "ネイル" },
  { value: "hair", label: "ヘアサロン" },
  { value: "bodycare", label: "ボディケア・整体" },
  { value: "other", label: "その他" },
];

export const MENU_PRESETS: Record<BusinessType, MenuPreset[]> = {
  esthetic: [
    { name: "フェイシャル", duration: 60, price: 8000 },
    { name: "ボディトリートメント", duration: 90, price: 12000 },
    { name: "脱毛（部分）", duration: 30, price: 5000 },
  ],
  eyelash: [
    { name: "マツエク 100本", duration: 60, price: 6000 },
    { name: "マツエク 付け放題", duration: 90, price: 9000 },
    { name: "オフのみ", duration: 30, price: 2000 },
  ],
  nail: [
    { name: "ハンドジェル", duration: 90, price: 7000 },
    { name: "フットジェル", duration: 90, price: 8000 },
    { name: "オフのみ", duration: 30, price: 1500 },
  ],
  hair: [
    { name: "カット", duration: 60, price: 5000 },
    { name: "カット + カラー", duration: 120, price: 12000 },
    { name: "カット + パーマ", duration: 150, price: 14000 },
  ],
  bodycare: [
    { name: "全身もみほぐし 60分", duration: 60, price: 6000 },
    { name: "全身もみほぐし 90分", duration: 90, price: 8500 },
    { name: "肩・首集中ケア", duration: 30, price: 3500 },
  ],
  other: [
    { name: "メニュー 60分", duration: 60, price: 6000 },
    { name: "メニュー 90分", duration: 90, price: 9000 },
  ],
};
