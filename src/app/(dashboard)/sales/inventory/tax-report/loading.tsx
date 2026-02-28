export default function TaxReportLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 skeleton rounded-lg" />
        <div className="h-10 w-20 skeleton rounded-xl" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-24 skeleton rounded-lg" />
            <div className="h-4 w-20 skeleton rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
