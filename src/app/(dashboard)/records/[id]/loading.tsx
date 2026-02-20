export default function RecordDetailLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-36 bg-border rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-border rounded-lg animate-pulse mt-1" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-5 w-32 bg-border rounded-lg animate-pulse" />
        <div className="h-4 w-full bg-border rounded-lg animate-pulse" />
        <div className="h-4 w-3/4 bg-border rounded-lg animate-pulse" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 h-48 animate-pulse" />
    </div>
  );
}
