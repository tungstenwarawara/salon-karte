export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-border/30 rounded" />
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-4 w-32 bg-border/30 rounded" />
        <div className="h-4 w-full bg-border/30 rounded" />
        <div className="h-10 w-48 bg-border/30 rounded-xl" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-4 w-40 bg-border/30 rounded" />
        <div className="h-32 w-full bg-border/30 rounded-xl" />
      </div>
    </div>
  );
}
