export default function MenusLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 skeleton rounded-lg" />
        <div className="h-10 w-16 skeleton rounded-xl" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton border border-border rounded-xl p-4 h-16" />
      ))}
    </div>
  );
}
