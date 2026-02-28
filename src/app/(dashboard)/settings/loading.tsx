export default function SettingsLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-16 skeleton rounded-lg" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-5 w-28 skeleton rounded-lg" />
        <div className="h-12 skeleton rounded-xl" />
        <div className="h-12 skeleton rounded-xl" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton border border-border rounded-2xl p-4 h-16" />
      ))}
    </div>
  );
}
