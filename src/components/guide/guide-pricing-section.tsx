/** 料金プラン比較セクション — リデザイン */

const STANDARD_FEATURES = [
  "顧客管理（人数無制限）",
  "施術記録（カルテ）・枚数無制限",
  "ビフォーアフター写真の保存（5GB）",
  "カルテPDF出力",
  "予約管理（空き時間表示・重複チェック）",
  "LINE連携（リマインド・来店促進）",
  "カウンセリングシート（デジタル問診票）",
  "物販購入履歴・回数券管理",
  "売上レポート・売上分析",
  "在庫管理・確定申告サポート",
  "スタッフ管理・シフト設定",
  "CSVエクスポート/インポート",
];

const MARKET_PRICES = [
  { label: "カルテ管理特化型", range: "5,000〜8,000円" },
  { label: "予約+顧客管理型", range: "10,000〜15,000円" },
  { label: "総合サロン管理型", range: "15,000〜25,000円" },
];

export function GuidePricingSection() {
  return (
    <div className="space-y-4">
      {/* スタンダードプラン */}
      <div className="relative bg-surface border-2 border-accent rounded-2xl p-5 overflow-hidden">
        {/* おすすめバッジ */}
        <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
          おすすめ
        </div>

        <div className="mb-4">
          <h4 className="font-bold text-sm">スタンダードプラン</h4>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-accent">2,980</span>
            <span className="text-xs text-text-light">円/月（税込）</span>
          </div>
          <p className="text-xs text-text-light mt-1">初期費用 0円</p>
        </div>

        <div className="space-y-2">
          {STANDARD_FEATURES.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 text-accent mt-0.5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-text-light">{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-text-light">
            オプション：写真容量アップ（5GB → 20GB）
            <strong className="text-text ml-1">+500円/月</strong>
          </p>
        </div>
      </div>

      {/* おためしプラン */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sm">おためしプラン</h4>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">0</span>
            <span className="text-xs text-text-light">円</span>
          </div>
        </div>
        <p className="text-sm text-text-light leading-relaxed">
          まずは試してみたい方向け。顧客10件・カルテ1顧客あたり5件・予約月20件まで。
          写真保存・LINE連携・カウンセリングシート・売上分析は含まれません。
        </p>
      </div>

      {/* 市場価格帯との比較 */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h4 className="font-bold text-sm mb-3">サロン管理ツールの一般的な価格帯</h4>
        <div className="space-y-0">
          {MARKET_PRICES.map(({ label, range }) => (
            <div key={label} className="flex justify-between items-center py-2.5 border-b border-border">
              <span className="text-sm text-text-light">{label}</span>
              <span className="text-sm font-medium">月額 {range}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-2.5 mt-1 bg-accent/5 rounded-lg px-3 -mx-1">
            <span className="font-bold text-sm text-accent">サロンカルテ</span>
            <span className="font-bold text-sm text-accent">月額 2,980円</span>
          </div>
        </div>
        <p className="text-xs text-text-light mt-3 leading-relaxed">
          初期費用0円。LINE連携・問診票・売上分析・在庫管理・確定申告サポート・スタッフ管理が月額2,980円に全て含まれています。
        </p>
      </div>
    </div>
  );
}
