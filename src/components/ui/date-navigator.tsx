/** 前後ナビゲーション付き日付表示（予約・売上ページ共通） */
export function DateNavigator({ label, onPrev, onNext, disableNext }: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  disableNext?: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
      <button onClick={onPrev} className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <span className="font-medium text-sm">{label}</span>
      <button onClick={onNext} disabled={disableNext} className="text-text-light hover:text-text p-1 min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
