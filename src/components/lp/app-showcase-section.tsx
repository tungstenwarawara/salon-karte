"use client";

/** アプリショーケース — タブ切替でアプリ画面をインタラクティブに見せる */

import { useState, lazy, Suspense } from "react";
import { PhoneFrame } from "./phone-frame";

const MockKarteScreen = lazy(() => import("./mockup-screens").then((m) => ({ default: m.MockKarteScreen })));
const MockAppointmentScreen = lazy(() => import("./mockup-screens").then((m) => ({ default: m.MockAppointmentScreen })));
const MockCustomerScreen = lazy(() => import("./mockup-screens").then((m) => ({ default: m.MockCustomerScreen })));
const MockSalesScreen = lazy(() => import("./mockup-screens").then((m) => ({ default: m.MockSalesScreen })));

function ScreenFallback() {
  return <div className="w-full h-full bg-background animate-pulse rounded-lg" />;
}

const TABS = [
  {
    key: "karte",
    label: "カルテ",
    caption: "施術内容・写真・メモをスマホからサッと記録。お客様が帰った後に3分で完了。",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
    Screen: MockKarteScreen,
  },
  {
    key: "appointment",
    label: "予約",
    caption: "予約の一覧・空き確認・LINE自動通知。ダブルブッキングを完全防止。",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
    Screen: MockAppointmentScreen,
  },
  {
    key: "customer",
    label: "顧客",
    caption: "来店履歴・好み・回数券をひと目で確認。「また来たい」をサポート。",
    icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
    Screen: MockCustomerScreen,
  },
  {
    key: "sales",
    label: "売上",
    caption: "売上推移・内訳・確定申告レポート。数字の管理をアプリにおまかせ。",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
    Screen: MockSalesScreen,
  },
] as const;

export function AppShowcaseSection() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-4">
        {/* 見出し */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance [word-break:auto-phrase]">
            使いやすさを、見てください
          </h2>
          <p className="text-text-light text-lg text-pretty [word-break:auto-phrase]">
            直感的な画面で、ITが苦手でもすぐに使いこなせます
          </p>
        </div>

        {/* タブ */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-background rounded-2xl p-1.5 border border-border/50 gap-1">
            {TABS.map((t, i) => (
              <button
                key={t.key}
                onClick={() => setActive(i)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  i === active
                    ? "bg-accent text-white shadow-md shadow-accent/20"
                    : "text-text-light hover:text-text hover:bg-white/60"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                </svg>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* スマホモックアップ + キャプション */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div className="animate-float-phone">
            <PhoneFrame key={tab.key}>
              <div className="animate-screen-fade-in">
                <Suspense fallback={<ScreenFallback />}>
                  <tab.Screen />
                </Suspense>
              </div>
            </PhoneFrame>
          </div>

          <div className="max-w-sm text-center md:text-left">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4 mx-auto md:mx-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-balance [word-break:auto-phrase]">{tab.label}管理</h3>
            <p className="text-text-light leading-relaxed text-pretty [word-break:auto-phrase]">{tab.caption}</p>
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-2">
              {TABS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === active ? "bg-accent scale-125" : "bg-border hover:bg-accent/40"
                  }`}
                  aria-label={`${TABS[i].label}画面を表示`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
