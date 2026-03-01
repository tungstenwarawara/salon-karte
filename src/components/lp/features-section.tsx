/** 機能ベネフィット 4 カード */

import { ScrollFadeIn } from "./scroll-fade-in";

const FEATURES = [
  {
    title: "カルテを3分で記録",
    description:
      "施術内容・写真・カウンセリングをスマホからサッと記録。お客様が帰った後に3分で完了。",
    details: [
      "施術写真のビフォーアフター",
      "デジタルカウンセリングシート",
      "施術メニュー・料金の自動記録",
    ],
    iconPath:
      "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  },
  {
    title: "LINEで予約もリマインドも自動",
    description:
      "お客様はLINEから24時間いつでも予約。リマインド通知で当日キャンセルも激減。",
    details: [
      "LINE公式アカウント連携",
      "自動リマインド通知",
      "空き時間のリアルタイム表示",
    ],
    iconPath:
      "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z",
  },
  {
    title: "売上も在庫も確定申告もラクに",
    description:
      "売上レポート・在庫管理・確定申告サポートが全部入り。数字の管理をアプリにおまかせ。",
    details: [
      "月次・年次売上レポート",
      "商品在庫の自動管理",
      "確定申告用データ出力",
    ],
    iconPath:
      "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
  },
  {
    title: "お客様との関係を深める",
    description:
      "来店間隔の管理、離脱アラート、LTV分析で「また来たい」サロンづくりをサポート。",
    details: [
      "離脱リスク顧客の自動検知",
      "顧客ランク・LTV分析",
      "来店履歴の完全記録",
    ],
    iconPath:
      "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-[#F5F1ED]">
      <div className="max-w-5xl mx-auto px-4">
        <ScrollFadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              サロン運営に必要な機能が、
              <br className="md:hidden" />
              ぜんぶ入ってます
            </h2>
            <p className="text-text-light text-lg">
              月額2,980円に全機能込み。追加費用は一切ありません。
            </p>
          </div>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <ScrollFadeIn key={f.title} delay={i * 100}>
              <div className="bg-white rounded-2xl p-6 border border-border/50 hover:shadow-[var(--shadow-card-hover)] transition-shadow h-full">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.iconPath} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-text-light text-sm leading-relaxed mb-4">
                  {f.description}
                </p>
                <ul className="space-y-1.5">
                  {f.details.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-sm text-text-light">
                      <CheckIcon />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
