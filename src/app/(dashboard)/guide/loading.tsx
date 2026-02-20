export default function GuideLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-32 bg-border rounded-lg animate-pulse" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-5 h-24 animate-pulse" />
      ))}
    </div>
  );
}
