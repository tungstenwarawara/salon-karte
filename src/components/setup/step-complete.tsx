"use client";

import { Confetti } from "@/components/ui/confetti";

type StepCompleteProps = {
  salonName: string;
  setupSummary: { businessHours: boolean; menu: boolean };
  onStart: (withSample: boolean) => void;
  loading?: boolean;
};

/** 完了チェックマーク SVG（描画アニメーション付き） */
function AnimatedCheck() {
  return (
    <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
      <svg viewBox="0 0 24 24" className="w-10 h-10 text-success" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M5 13l4 4L19 7"
          style={{ strokeDasharray: 56, strokeDashoffset: 56, animation: "draw-check 0.6s ease-out 0.4s forwards" }}
        />
      </svg>
    </div>
  );
}

/** 顧客アイコン SVG */
function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#C4956A" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
    </svg>
  );
}

/** カレンダーアイコン SVG */
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#C4956A" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

/** カルテアイコン SVG */
function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#C4956A" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4a2 2 0 012-2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

/** 1日の流れ ミニビジュアル */
function DailyFlowVisual() {
  const steps = [
    { icon: <PersonIcon />, label: "顧客登録" },
    { icon: <CalendarIcon />, label: "予約" },
    { icon: <NoteIcon />, label: "カルテ" },
  ];

  return (
    <div className="bg-background rounded-xl p-4">
      <p className="text-xs text-text-light text-center mb-3 font-medium">使い方の流れ</p>
      <div className="flex items-center justify-center gap-1">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm">
                {step.icon}
              </div>
              <span className="text-[10px] text-text-light">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-border shrink-0 mb-4" fill="currentColor">
                <path d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepComplete({ salonName, setupSummary, onStart, loading }: StepCompleteProps) {
  const summaryItems = [
    { label: "サロン情報", done: true },
    { label: "営業時間", done: setupSummary.businessHours },
    { label: "メニュー", done: setupSummary.menu },
  ];

  return (
    <div className="space-y-6 text-center animate-fade-in-up">
      <Confetti />

      <AnimatedCheck />

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold">{salonName} の準備ができました！</h2>
        <p className="text-sm text-text-light">さっそく使い始めましょう</p>
      </div>

      {/* セットアップサマリー */}
      <div className="flex justify-center gap-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              item.done ? "bg-success/10 text-success" : "bg-border/30 text-text-light"
            }`}>
              {item.done ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-xs">—</span>
              )}
            </div>
            <span className={`text-[10px] ${item.done ? "text-text" : "text-text-light"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* 1日の流れ */}
      <DailyFlowVisual />

      {/* CTA: サンプルあり / なし の2系統。サンプル付きを推奨配置 */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onStart(true)}
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-light text-white font-bold rounded-xl py-3.5 transition-colors min-h-[48px] shadow-md disabled:opacity-50"
        >
          {loading ? "登録中..." : "サンプルで使い方を試す"}
        </button>
        <p className="text-[11px] text-text-light text-center">
          お試し用のお客様2人とメニュー1件を入れます（いつでも削除できます）
        </p>
        <button
          type="button"
          onClick={() => onStart(false)}
          disabled={loading}
          className="w-full bg-background border border-border hover:bg-border/20 text-text font-medium rounded-xl py-3 transition-colors min-h-[48px] disabled:opacity-50"
        >
          サンプルなしで始める
        </button>
      </div>
    </div>
  );
}
