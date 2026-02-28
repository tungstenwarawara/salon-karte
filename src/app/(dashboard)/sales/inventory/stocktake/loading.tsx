export default function StocktakeLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-20 skeleton rounded-lg" />
        <div className="h-4 w-48 skeleton rounded-lg mt-1" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton border border-border rounded-xl p-4 h-16" />
      ))}
      <div className="h-12 skeleton rounded-xl" />
    </div>
  );
}
