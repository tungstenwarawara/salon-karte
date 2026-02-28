export default function ExportLoading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-12 skeleton/50 rounded" />
      <div className="h-7 w-48 skeleton/50 rounded" />
      <div className="h-4 w-64 skeleton/50 rounded" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-24 skeleton/50 rounded" />
              <div className="h-3 w-12 skeleton/50 rounded" />
            </div>
            <div className="h-10 w-28 skeleton/50 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
