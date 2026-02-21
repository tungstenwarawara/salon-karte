export default function SettingsLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-16 bg-border rounded-lg animate-pulse" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-5 w-28 bg-border rounded-lg animate-pulse" />
        <div className="h-12 bg-border rounded-xl animate-pulse" />
        <div className="h-12 bg-border rounded-xl animate-pulse" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-4 h-16 animate-pulse" />
      ))}
    </div>
  );
}
