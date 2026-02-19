export default function InventoryLoading() {
  return (
    <div className="space-y-4">
      {/* Tabs skeleton */}
      <div className="flex gap-1.5 bg-background rounded-xl p-1">
        <div className="flex-1 h-[44px] bg-border rounded-lg animate-pulse" />
        <div className="flex-1 h-[44px] bg-border rounded-lg animate-pulse" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
            <div className="h-3 bg-border rounded w-12 mb-2 mx-auto" />
            <div className="h-6 bg-border rounded w-8 mx-auto" />
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 h-14 animate-pulse" />
        ))}
      </div>

      {/* Product list skeleton */}
      <div className="bg-surface border border-border rounded-2xl p-4 animate-pulse space-y-3">
        <div className="h-4 bg-border rounded w-20" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-border rounded-xl" />
        ))}
      </div>
    </div>
  );
}
