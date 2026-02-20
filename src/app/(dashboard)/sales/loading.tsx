export default function SalesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 bg-border rounded-lg animate-pulse" />
        <div className="h-10 w-20 bg-border rounded-xl animate-pulse" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 h-64 animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-3 h-20 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
