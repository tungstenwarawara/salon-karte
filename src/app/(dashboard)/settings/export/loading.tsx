export default function ExportLoading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-12 bg-border/50 rounded animate-pulse" />
      <div className="h-7 w-48 bg-border/50 rounded animate-pulse" />
      <div className="h-4 w-64 bg-border/50 rounded animate-pulse" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-24 bg-border/50 rounded animate-pulse" />
              <div className="h-3 w-12 bg-border/50 rounded animate-pulse" />
            </div>
            <div className="h-10 w-28 bg-border/50 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
