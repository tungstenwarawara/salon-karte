export default function LineSettingsLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-4 w-24 bg-border rounded-lg animate-pulse mb-2" />
        <div className="h-7 w-32 bg-border rounded-lg animate-pulse" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div className="h-5 w-40 bg-border rounded-lg animate-pulse" />
        <div className="h-12 bg-border rounded-xl animate-pulse" />
        <div className="h-12 bg-border rounded-xl animate-pulse" />
        <div className="h-12 bg-border rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
