export default function SalesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 skeleton rounded-lg" />
        <div className="h-10 w-20 skeleton rounded-xl" />
      </div>
      <div className="skeleton border border-border rounded-2xl p-5 h-64" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton border border-border rounded-2xl p-3 h-20" />
        ))}
      </div>
    </div>
  );
}
