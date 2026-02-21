export default function RecordsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 bg-border rounded-lg animate-pulse" />
        <div className="h-10 w-16 bg-border rounded-xl animate-pulse" />
      </div>
      <div className="h-12 bg-surface border border-border rounded-xl animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-4 h-20 animate-pulse" />
      ))}
    </div>
  );
}
