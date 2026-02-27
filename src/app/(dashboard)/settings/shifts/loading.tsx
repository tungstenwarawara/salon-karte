export default function ShiftsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 bg-border rounded-lg animate-pulse" />
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="h-10 bg-border rounded-lg animate-pulse mb-3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-border rounded-lg animate-pulse mb-2" />
        ))}
      </div>
    </div>
  );
}
