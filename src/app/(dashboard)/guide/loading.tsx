export default function GuideLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-32 skeleton rounded-lg" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton border border-border rounded-2xl p-5 h-24" />
      ))}
    </div>
  );
}
