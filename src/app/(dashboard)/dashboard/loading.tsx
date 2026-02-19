export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-40 bg-border rounded-lg animate-pulse" />
        <div className="h-4 w-24 bg-border rounded-lg animate-pulse mt-1" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-3 h-20 animate-pulse" />
        ))}
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 h-36 animate-pulse" />
      <div>
        <div className="h-5 w-28 bg-border rounded-lg animate-pulse mb-3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-3 h-16 animate-pulse mb-2" />
        ))}
      </div>
    </div>
  );
}
