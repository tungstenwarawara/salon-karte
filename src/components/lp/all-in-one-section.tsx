/** ツールの掛け持ち不要 — Before/After + 3つのベネフィット */

import { ScrollFadeIn } from "./scroll-fade-in";

const SCATTERED_TOOLS = [
  { name: "カルテアプリ", cost: "月5,500円", icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
  { name: "予約システム", cost: "月3,300円", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" },
  { name: "Excel売上管理", cost: "手入力の手間", icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" },
  { name: "在庫メモ帳", cost: "管理が煩雑", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" },
  { name: "会計ソフト入力", cost: "毎月の転記作業", icon: "M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" },
];

const BENEFITS = [
  {
    title: "データが自動でつながる",
    description: "カルテを書けば売上に反映。回数券を使えば残数が更新。二重入力ゼロ。",
    icon: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  },
  {
    title: "月額2,980円 ぽっきり",
    description: "追加料金・オプション課金なし。全機能がこの価格に含まれています。",
    icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    title: "スマホ1つで完結",
    description: "施術の合間にサッと確認、帰宅後に3分で記録。PCがなくても大丈夫。",
    icon: "M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18h6",
  },
];

/** 下矢印（モバイル）/ 右矢印（デスクトップ） */
function ArrowDown() {
  return (
    <div className="flex items-center justify-center py-4 md:py-0 md:px-4 flex-shrink-0">
      {/* モバイル: 下向き */}
      <svg className="w-8 h-8 text-accent md:hidden" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
      {/* デスクトップ: 右向き */}
      <svg className="w-10 h-10 text-accent hidden md:block" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  );
}

export function AllInOneSection() {
  return (
    <section className="py-16 md:py-24 bg-[#F5F1ED]">
      <div className="max-w-5xl mx-auto px-4">
        {/* 見出し */}
        <ScrollFadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ツールの掛け持ち、
              <br className="md:hidden" />
              やめませんか？
            </h2>
            <p className="text-text-light text-lg max-w-2xl mx-auto leading-relaxed">
              カルテ管理、予約管理、売上管理、在庫管理、会計ソフト連携——
              <br className="hidden md:block" />
              バラバラのツールを使い分ける手間から解放されます。
            </p>
          </div>
        </ScrollFadeIn>

        {/* Before → After */}
        <ScrollFadeIn delay={100}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-0">
            {/* Before: バラバラのツール */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-xs sm:max-w-sm flex-shrink-0">
              {SCATTERED_TOOLS.map((tool) => (
                <div
                  key={tool.name}
                  className="bg-white/60 border border-border/60 rounded-xl p-2.5 sm:p-3 text-center opacity-70"
                >
                  <svg className="w-5 h-5 text-text-light/60 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
                  </svg>
                  <div className="text-xs font-medium text-text-light truncate">{tool.name}</div>
                  <div className="text-[10px] text-red-400 mt-0.5">{tool.cost}</div>
                </div>
              ))}
              {/* 合計ラベル（5枠目の右に配置される偶数揃え） */}
              <div className="flex items-center justify-center">
                <span className="text-xs text-text-light font-medium">合計すると高額&hellip;</span>
              </div>
            </div>

            <ArrowDown />

            {/* After: サロンカルテ1つ */}
            <div className="relative flex-shrink-0 w-full max-w-xs sm:max-w-sm">
              <div className="absolute -inset-2 bg-accent/10 rounded-3xl blur-xl" />
              <div className="relative bg-white border-2 border-accent rounded-2xl p-5 sm:p-6 text-center shadow-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-3">
                  <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                </div>
                <div className="text-lg font-bold mb-1">サロンカルテ</div>
                <div className="text-sm text-text-light mb-3">全部入り・追加料金なし</div>
                <div className="inline-block bg-accent/5 border border-accent/20 rounded-xl px-4 py-2">
                  <span className="text-2xl font-bold text-accent">2,980</span>
                  <span className="text-sm text-accent ml-0.5">円/月</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollFadeIn>

        {/* 3つのベネフィット */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mt-14">
          {BENEFITS.map((b, i) => (
            <ScrollFadeIn key={b.title} delay={200 + i * 100}>
              <div className="bg-white rounded-2xl p-5 border border-border/40">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4.5 h-4.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                    </svg>
                  </div>
                  <h3 className="font-bold text-sm">{b.title}</h3>
                </div>
                <p className="text-text-light text-sm leading-relaxed pl-12">
                  {b.description}
                </p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
