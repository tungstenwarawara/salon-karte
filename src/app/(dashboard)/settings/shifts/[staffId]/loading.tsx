export default function StaffShiftLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 skeleton rounded-lg" />
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-14 skeleton rounded-lg" />
        ))}
      </div>
    </div>
  );
}
