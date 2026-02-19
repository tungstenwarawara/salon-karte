export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 bg-border rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-border rounded-lg animate-pulse mt-1" />
        </div>
        <div className="h-4 w-8 bg-border rounded animate-pulse" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 h-36 animate-pulse" />
      <div className="bg-surface border border-border rounded-2xl p-5 h-28 animate-pulse" />
      <div className="bg-surface border border-border rounded-2xl p-5 h-48 animate-pulse" />
    </div>
  );
}
