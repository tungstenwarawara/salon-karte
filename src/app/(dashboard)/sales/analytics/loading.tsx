export default function AnalyticsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-48 bg-border rounded" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 space-y-2">
            <div className="h-3 w-16 bg-border rounded mx-auto" />
            <div className="h-6 w-24 bg-border rounded mx-auto" />
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="h-3 w-32 bg-border rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-border rounded" />
        ))}
      </div>
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="h-3 w-24 bg-border rounded" />
        <div className="h-40 bg-border rounded" />
      </div>
    </div>
  );
}
