export default function HolidaysLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 bg-border rounded-lg animate-pulse" />
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="h-10 bg-border rounded-lg animate-pulse" />
        <div className="grid grid-cols-7 gap-1">
          {[...Array(35)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-border rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="h-12 bg-border rounded-xl animate-pulse" />
    </div>
  );
}
