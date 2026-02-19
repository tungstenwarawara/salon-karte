export default function AppointmentsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 bg-border rounded-lg animate-pulse" />
        <div className="h-10 w-24 bg-border rounded-xl animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-16 bg-border rounded-xl animate-pulse" />
        <div className="h-10 w-16 bg-border rounded-xl animate-pulse" />
      </div>
      <div className="bg-surface border border-border rounded-xl px-4 py-3 h-12 animate-pulse" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-3 h-24 animate-pulse" />
      ))}
    </div>
  );
}
