/** 機能ベネフィット — 交互レイアウト + ミニモックアップ */

import { ScrollFadeIn } from "./scroll-fade-in";
import { PhoneFrame } from "./phone-frame";
import {
  MockKarteScreen,
  MockAppointmentScreen,
  MockCustomerScreen,
  MockSalesScreen,
} from "./mockup-screens";

const FEATURES = [
  {
    title: "カルテを3分で記録",
    description:
      "施術内容・写真・カウンセリングをスマホからサッと記録。紙のカルテを探す手間がゼロに。",
    details: [
      "施術写真のビフォーアフター",
      "デジタルカウンセリングシート",
      "施術メニュー・料金の自動記録",
    ],
    Screen: MockKarteScreen,
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
    Screen: MockAppointmentScreen,
  },
  {
    title: "お客様との関係を深める",
    description:
      "来店間隔の管理、離脱アラート、LTV分析で「また来たい」サロンづくりをサポート。",
    details: [
      "離脱リスク顧客の自動検知",
      "顧客ランク・LTV分析",
      "回数券・来店履歴の完全記録",
    ],
    Screen: MockCustomerScreen,
  },
  {
    title: "売上も在庫も数字の管理がラクに",
    description:
      "売上レポート・在庫管理・会計ソフト連携が全部入り。数字の管理をアプリにおまかせ。",
    details: [
      "月次・年次売上レポート",
      "商品在庫の自動管理",
      "会計ソフト連携CSV出力",
    ],
    Screen: MockSalesScreen,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-[#F5F1ED]">
      <div className="max-w-5xl mx-auto px-4">
        <ScrollFadeIn>
          <div className="text-center mb-16">
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

        <div className="space-y-20 md:space-y-28">
          {FEATURES.map((f, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={f.title}
                className={`flex flex-col items-center gap-10 md:gap-16 ${
                  reverse ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                {/* ミニモックアップ */}
                <ScrollFadeIn
                  direction={reverse ? "right" : "left"}
                  delay={100}
                  className="flex-shrink-0"
                >
                  <div className="scale-90 md:scale-100">
                    <PhoneFrame minHeight={420} glow={false}>
                      <f.Screen />
                    </PhoneFrame>
                  </div>
                </ScrollFadeIn>

                {/* テキスト */}
                <ScrollFadeIn
                  direction={reverse ? "left" : "right"}
                  delay={200}
                  className="flex-1 text-center md:text-left"
                >
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">{f.title}</h3>
                  <p className="text-text-light text-base leading-relaxed mb-6 max-w-md mx-auto md:mx-0">
                    {f.description}
                  </p>
                  <ul className="space-y-3 inline-block text-left">
                    {f.details.map((d) => (
                      <li key={d} className="flex items-center gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </ScrollFadeIn>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
