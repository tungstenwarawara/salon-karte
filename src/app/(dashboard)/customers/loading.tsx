export default function CustomersLoading() {
  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 skeleton rounded-lg" />
        <div className="h-10 w-28 skeleton rounded-xl" />
      </div>
      {/* 検索 */}
      <div className="h-12 skeleton border border-border rounded-xl" />
      {/* 来店間隔フィルター */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[44px] w-20 skeleton rounded-lg" />
          ))}
        </div>
        {/* ソートボタン */}
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[44px] w-20 skeleton rounded-lg" />
          ))}
        </div>
      </div>
      {/* カード */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton border border-border rounded-xl p-4 h-16" />
      ))}
    </div>
  );
}
