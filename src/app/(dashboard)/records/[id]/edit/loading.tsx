export default function RecordEditLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-36 bg-border rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-border rounded-lg animate-pulse mt-1" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div className="h-12 bg-border rounded-xl animate-pulse" />
        <div className="h-12 bg-border rounded-xl animate-pulse" />
        <div className="h-24 bg-border rounded-xl animate-pulse" />
        <div className="h-12 bg-border rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
