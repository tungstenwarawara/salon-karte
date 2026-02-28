export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-40 skeleton rounded-lg" />
        <div className="h-4 w-24 skeleton rounded-lg mt-1" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton border border-border rounded-2xl p-3 h-20" />
        ))}
      </div>
      <div className="skeleton border border-border rounded-2xl p-5 h-36" />
      <div>
        <div className="h-5 w-28 skeleton rounded-lg mb-3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton border border-border rounded-xl p-3 h-16 mb-2" />
        ))}
      </div>
    </div>
  );
}
