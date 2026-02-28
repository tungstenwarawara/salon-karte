export default function BusinessHoursLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-32 skeleton rounded-lg" />
        <div className="h-4 w-48 skeleton rounded-lg mt-1" />
      </div>
      {[...Array(7)].map((_, i) => (
        <div key={i} className="skeleton border border-border rounded-xl p-3 h-14" />
      ))}
      <div className="h-12 skeleton rounded-xl" />
    </div>
  );
}
