export default function InventoryLoading() {
  return (
    <div className="space-y-4">
      {/* タブ */}
      <div className="flex gap-1.5 bg-background rounded-xl p-1">
        <div className="flex-1 h-[44px] skeleton rounded-lg" />
        <div className="flex-1 h-[44px] skeleton rounded-lg" />
      </div>

      {/* サマリーカード 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton border border-border rounded-xl p-4">
            <div className="h-3 bg-border rounded w-12 mb-2 mx-auto" />
            <div className="h-6 bg-border rounded w-8 mx-auto" />
          </div>
        ))}
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton border border-border rounded-xl p-4 h-14" />
        ))}
      </div>

      {/* 在庫一覧 */}
      <div className="space-y-3">
        <div className="h-5 bg-border rounded w-20" />
        <div className="h-12 bg-border rounded-xl" />
        <div className="flex gap-2">
          <div className="h-[44px] bg-border rounded-lg w-16" />
          <div className="h-[44px] bg-border rounded-lg w-24" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-surface border border-border rounded-xl" />
        ))}
      </div>
    </div>
  );
}
