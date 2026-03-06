/** FAQ セクション — details/summary アコーディオン + JSON-LD */

import { ScrollFadeIn } from "./scroll-fade-in";

const FAQ_ITEMS = [
  {
    q: "スマホだけで使えますか？",
    a: "はい、スマホのブラウザだけで全機能をご利用いただけます。アプリのインストールは不要です。もちろん、パソコンやタブレットからもアクセスできます。",
  },
  {
    q: "他のサービスからのデータ移行はできますか？",
    a: "CSVインポート機能で顧客データの一括インポートが可能です。現在お使いの顧客管理ソフトやExcelファイルからスムーズに移行いただけます。",
  },
  {
    q: "LINE連携はどうやって設定しますか？",
    a: "LINE公式アカウントをお持ちであれば、設定画面からチャネルIDとシークレットキーを入力するだけで連携できます。設定ガイドもご用意しています。",
  },
  {
    q: "いつでも解約できますか？",
    a: "はい、解約の縛りはありません。管理画面からいつでもプランの変更・解約が可能です。解約後も当月末までサービスをご利用いただけます。",
  },
  {
    q: "セキュリティは大丈夫ですか？",
    a: "お客様のデータはすべて暗号化され、安全なクラウド環境（Supabase）で管理しています。サロンごとに完全にデータが分離されており、他のサロンのデータにアクセスすることはできません。",
  },
  {
    q: "何人までお客様を登録できますか？",
    a: "スタンダードプランでは、顧客数・カルテ枚数ともに無制限です。お客様が増えても追加料金はかかりません。",
  },
  {
    q: "無料プランと有料プランの違いは？",
    a: "おためしプラン（無料）は顧客10件・カルテ1顧客あたり5件・予約月20件まで。スタンダードプランでは全機能が無制限でお使いいただけます。まずは無料でお試しいただき、本格運用時にアップグレードいただけます。",
  },
  {
    q: "確定申告のサポートとは具体的に何ですか？",
    a: "月次・年次の売上データ、経費区分別の集計、前受金（回数券の未消化分）の算出など、確定申告に必要なデータをワンクリックで出力できます。税理士さんへの共有も簡単です。",
  },
  {
    q: "困ったときはどこに相談できますか？",
    a: "support@salonkarte.com までお気軽にメールでご連絡ください。使い方のご質問、ご要望、不具合のご報告など、通常1〜2営業日以内にご返信いたします。",
  },
];

export function FaqSection() {
  return (
    <section className="py-16 md:py-24 bg-[#F5F1ED]">
      <div className="max-w-3xl mx-auto px-4">
        <ScrollFadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              よくあるご質問
            </h2>
          </div>
        </ScrollFadeIn>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <ScrollFadeIn key={item.q} delay={i * 50}>
              <details className="group bg-background rounded-2xl border border-border/50 overflow-hidden">

              <summary className="flex items-center justify-between gap-4 cursor-pointer p-5 font-medium text-sm md:text-base list-none min-h-[56px] hover:bg-accent/5 transition-colors">
                {item.q}
                <svg
                  className="w-5 h-5 text-text-light flex-shrink-0 transition-transform duration-200 details-open-rotate"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-text-light leading-relaxed border-t border-border/50 pt-4">
                {item.a}
              </div>
              </details>
            </ScrollFadeIn>
          ))}
        </div>
      </div>

      {/* JSON-LD FAQPage 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.a,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
