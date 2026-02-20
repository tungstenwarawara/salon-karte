export default function ImportHubLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 bg-border rounded w-1/3" />
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="h-4 bg-border rounded w-2/3 mb-2" />
        <div className="h-3 bg-border rounded w-1/2" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-border" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-border rounded w-1/3" />
              <div className="h-3 bg-border rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
