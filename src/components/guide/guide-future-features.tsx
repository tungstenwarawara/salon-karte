/** 今後追加予定の機能セクション */

const FUTURE_FEATURES = [
  {
    name: "Web予約ページ",
    desc: "お客様がスマホから24時間予約できる専用ページを自動生成。",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
];

export function GuideFutureFeatures() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-light">
        以下の機能は開発を検討中です。ご要望があればお気軽にお知らせください。
      </p>
      <div className="space-y-2">
        {FUTURE_FEATURES.map((feat) => (
          <div
            key={feat.name}
            className="bg-surface border border-border rounded-xl p-3 flex items-start gap-3"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center mt-0.5">
              {feat.icon}
            </div>
            <div>
              <h4 className="font-medium text-sm">{feat.name}</h4>
              <p className="text-xs text-text-light mt-0.5">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
