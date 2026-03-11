export default function DailyLoading() {
  return (
    <div className="space-y-4">
      {/* タブ */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-12 bg-surface border border-border rounded-xl animate-pulse" />
        ))}
      </div>
      {/* モード切替 */}
      <div className="flex justify-center">
        <div className="w-48 h-10 bg-surface border border-border rounded-xl animate-pulse" />
      </div>
      {/* サマリーカード */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-8 w-32 bg-background rounded animate-pulse" />
        <div className="h-6 w-24 bg-background rounded animate-pulse ml-auto" />
        <div className="h-2 bg-background rounded-full animate-pulse" />
      </div>
      {/* 顧客カード */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-3 space-y-2">
          <div className="flex justify-between">
            <div className="h-5 w-24 bg-background rounded animate-pulse" />
            <div className="h-5 w-16 bg-background rounded animate-pulse" />
          </div>
          <div className="h-4 w-48 bg-background rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
