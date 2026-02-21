export default function BusinessHoursLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-32 bg-border rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-border rounded-lg animate-pulse mt-1" />
      </div>
      {[...Array(7)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-3 h-14 animate-pulse" />
      ))}
      <div className="h-12 bg-border rounded-xl animate-pulse" />
    </div>
  );
}
