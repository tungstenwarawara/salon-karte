export default function LineSettingsLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-4 w-24 skeleton rounded-lg mb-2" />
        <div className="h-7 w-32 skeleton rounded-lg" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div className="h-5 w-40 skeleton rounded-lg" />
        <div className="h-12 skeleton rounded-xl" />
        <div className="h-12 skeleton rounded-xl" />
        <div className="h-12 skeleton rounded-xl" />
      </div>
    </div>
  );
}
