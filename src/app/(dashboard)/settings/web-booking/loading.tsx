export default function WebBookingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-border/30 rounded-lg w-48" />
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div className="h-5 bg-border/30 rounded w-32" />
        <div className="h-12 bg-border/30 rounded-xl" />
        <div className="h-12 bg-border/30 rounded-xl" />
      </div>
    </div>
  );
}
