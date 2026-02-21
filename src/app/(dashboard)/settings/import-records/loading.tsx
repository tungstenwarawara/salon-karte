export default function ImportRecordsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-border rounded w-1/3" />
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="h-4 bg-border rounded w-1/2" />
        <div className="h-3 bg-border rounded w-2/3" />
        <div className="h-10 bg-border rounded w-1/3" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="h-4 bg-border rounded w-1/2" />
        <div className="h-24 bg-border rounded" />
      </div>
    </div>
  );
}
