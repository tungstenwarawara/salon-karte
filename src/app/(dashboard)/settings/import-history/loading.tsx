export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-border rounded w-1/3 animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-border rounded w-1/4" />
                <div className="h-3 bg-border rounded w-1/2" />
              </div>
              <div className="h-8 bg-border rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
