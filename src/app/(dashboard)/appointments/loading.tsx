export default function AppointmentsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 skeleton rounded-lg" />
        <div className="h-10 w-24 skeleton rounded-xl" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-16 skeleton rounded-xl" />
        <div className="h-10 w-16 skeleton rounded-xl" />
      </div>
      <div className="skeleton border border-border rounded-xl px-4 py-3 h-12" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton border border-border rounded-xl p-3 h-24" />
      ))}
    </div>
  );
}
