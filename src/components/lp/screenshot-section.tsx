/** 画面イメージセクション — アプリの使いやすさを視覚的に訴求 */

import { ScrollFadeIn } from "./scroll-fade-in";

const SCREENS = [
  {
    title: "ダッシュボード",
    description: "今日の予約・売上・お知らせを一目で確認",
    color: "bg-accent/10 text-accent",
    iconPath: "M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  },
  {
    title: "カルテ記録",
    description: "施術内容・写真・メモをスマホでサッと記録",
    color: "bg-category-treatment/20 text-category-treatment",
    iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  },
  {
    title: "予約管理",
    description: "空き時間の表示・重複チェック・LINE通知",
    color: "bg-success/15 text-success",
    iconPath: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  },
  {
    title: "顧客管理",
    description: "来店履歴・好み・カウンセリングを一元管理",
    color: "bg-category-ticket/20 text-category-ticket",
    iconPath: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  },
];

export function ScreenshotSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <ScrollFadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              スマホひとつで、すべてを管理
            </h2>
            <p className="text-text-light text-lg">
              直感的な操作で、ITが苦手でもすぐに使いこなせます
            </p>
          </div>
        </ScrollFadeIn>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {SCREENS.map((s, i) => (
            <ScrollFadeIn key={s.title} delay={i * 100}>
              <div className="group bg-background rounded-2xl p-5 border border-border/50 hover:border-accent/30 transition-all text-center h-full">
                <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center mx-auto mb-4`}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.iconPath} />
                  </svg>
                </div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-text-light text-xs leading-relaxed">
                  {s.description}
                </p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        <p className="text-center text-sm text-text-light mt-8">
          すべての画面がつながり、サロン業務をスムーズにします
        </p>
      </div>
    </section>
  );
}
