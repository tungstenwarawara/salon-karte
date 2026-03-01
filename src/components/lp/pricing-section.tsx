/** 料金セクション — スタンダード + おためし + 市場比較 */

import Link from "next/link";

const STANDARD_FEATURES = [
  "顧客管理（人数無制限）",
  "施術記録（カルテ）・枚数無制限",
  "ビフォーアフター写真の保存（5GB）",
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

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-[#F5F1ED]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            シンプルな料金プラン
          </h2>
          <p className="text-text-light text-lg">
            必要な機能は、ぜんぶ入ってこの価格。
          </p>
        </div>

        {/* スタンダードプラン */}
        <div className="relative bg-white border-2 border-accent rounded-2xl p-6 md:p-8 mb-4 overflow-hidden">
          <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
            おすすめ
          </div>
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">スタンダードプラン</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl md:text-6xl font-bold text-accent">2,980</span>
              <span className="text-text-light">円/月（税込）</span>
            </div>
            <p className="text-sm text-text-light mt-2">初期費用 0円 ・ いつでも解約OK</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
            {STANDARD_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-sm text-text-light">{f}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 mb-6">
            <p className="text-xs text-text-light">
              オプション：写真容量アップ（5GB → 20GB）
              <strong className="text-text ml-1">+500円/月</strong>
            </p>
          </div>
          <Link
            href="/signup"
            className="block w-full bg-accent hover:bg-accent-light text-white font-bold rounded-2xl py-4 text-center text-lg transition-colors min-h-[56px]"
          >
            無料ではじめる
          </Link>
        </div>

        {/* おためしプラン */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">おためしプラン</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">0</span>
              <span className="text-sm text-text-light">円</span>
            </div>
          </div>
          <p className="text-sm text-text-light leading-relaxed">
            まずは試してみたい方向け。顧客10件・カルテ1顧客あたり5件・予約月20件まで。
            写真保存・LINE連携・カウンセリングシート・売上分析は含まれません。
          </p>
        </div>

        {/* 市場価格との比較 */}
        <div className="bg-white border border-border rounded-2xl p-6">
          <h3 className="font-bold mb-4">サロン管理ツールの一般的な価格帯</h3>
          {MARKET_PRICES.map(({ label, range }) => (
            <div key={label} className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-sm text-text-light">{label}</span>
              <span className="text-sm font-medium">月額 {range}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-3 mt-1 bg-accent/5 rounded-lg px-4 -mx-1">
            <span className="font-bold text-accent">サロンカルテ（全機能込み）</span>
            <span className="font-bold text-accent">月額 2,980円</span>
          </div>
        </div>
      </div>
    </section>
  );
}
