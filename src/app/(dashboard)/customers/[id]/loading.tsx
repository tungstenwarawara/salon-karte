export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 bg-border rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-border rounded-lg animate-pulse mt-1" />
        </div>
        <div className="h-4 w-8 bg-border rounded animate-pulse" />
      </div>

      {/* 来店分析カード */}
      <div className="bg-surface border border-border rounded-2xl p-5 h-36 animate-pulse" />

      {/* 基本情報カード */}
      <div className="bg-surface border border-border rounded-2xl p-5 h-28 animate-pulse" />
      <div className="bg-surface border border-border rounded-2xl p-5 h-20 animate-pulse" />

      {/* タブバー */}
      <div className="border-b border-border">
        <div className="flex gap-1 py-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-20 bg-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-3 h-14 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
