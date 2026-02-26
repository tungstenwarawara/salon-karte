export default function StaffLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-border rounded-lg animate-pulse" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-4 h-20 animate-pulse" />
      ))}
    </div>
  );
}
