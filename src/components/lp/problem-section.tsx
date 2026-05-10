import Link from "next/link";
import { ScrollFadeIn } from "./scroll-fade-in";

/** 紙カルテ — ファイル + 虫眼鏡 */
function IconPaperKarte() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

/** 掲載料 — 紙幣にバツ */
function IconCostHigh() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

/** 予約バラバラ — カレンダー + エクスクラメーション */
function IconScheduleChaos() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
    </svg>
  );
}

/** 確定申告 — 電卓 */
function IconTaxPanic() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008H15.75v-.008Zm0 2.25h.008v.008H15.75V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM5.25 20.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

const PROBLEMS = [
  {
    icon: IconPaperKarte,
    title: "紙のカルテ、もう限界…",
    body: "お客様が増えるほど探すのに時間がかかる。写真も貼れない。過去の施術内容をすぐに確認できない。",
  },
  {
    icon: IconCostHigh,
    title: "集客サイトの掲載料が高い",
    body: "月額5〜15万円の掲載料。でもリピーターが育たず、新規集客の繰り返し。",
  },
  {
    icon: IconScheduleChaos,
    title: "予約管理がバラバラ",
    body: "電話・LINE・DMの予約をそれぞれ管理。ダブルブッキングのヒヤリハット、ありませんか？",
  },
  {
    icon: IconTaxPanic,
    title: "確定申告で毎年バタバタ",
    body: "レシートの山、手書きの帳簿。毎年3月に地獄を見る。もっとラクにしたい。",
  },
];

export function ProblemSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <ScrollFadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance [word-break:auto-phrase]">
              こんなお悩み、ありませんか？
            </h2>
            <p className="text-text-light text-lg text-pretty [word-break:auto-phrase]">
              ひとりで抱え込んでいませんか？
            </p>
          </div>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROBLEMS.map((p, i) => (
            <ScrollFadeIn key={p.title} delay={i * 100} direction={i % 2 === 0 ? "left" : "right"}>
              <div className="bg-background rounded-2xl p-6 border border-border/50 hover:border-accent/30 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3">
                  <p.icon />
                </div>
                <h3 className="text-lg font-bold mb-2 text-balance [word-break:auto-phrase]">{p.title}</h3>
                <p className="text-text-light text-sm leading-relaxed text-pretty [word-break:auto-phrase]">{p.body}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        <ScrollFadeIn delay={400}>
          <div className="text-center mt-12 space-y-4">
            <div className="inline-flex items-center gap-2 bg-accent/5 rounded-full px-6 py-3 border border-accent/20">
              <span className="text-accent font-bold">サロンカルテ</span>
              <span className="text-text-light">が、すべて解決します</span>
            </div>
            <div>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center text-accent font-bold hover:underline text-sm min-h-[44px]"
              >
                無料で試してみる &rarr;
              </Link>
            </div>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
