export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 skeleton rounded-lg" />
          <div className="h-4 w-24 skeleton rounded-lg mt-1" />
        </div>
        <div className="h-4 w-8 skeleton rounded" />
      </div>

      {/* 来店分析カード */}
      <div className="skeleton border border-border rounded-2xl p-5 h-36" />

      {/* 基本情報カード */}
      <div className="skeleton border border-border rounded-2xl p-5 h-28" />
      <div className="skeleton border border-border rounded-2xl p-5 h-20" />

      {/* タブバー */}
      <div className="border-b border-border">
        <div className="flex gap-1 py-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-20 skeleton rounded-lg" />
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton border border-border rounded-xl p-3 h-14" />
        ))}
      </div>
    </div>
  );
}
