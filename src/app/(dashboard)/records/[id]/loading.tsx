export default function RecordDetailLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-36 skeleton rounded-lg" />
        <div className="h-4 w-48 skeleton rounded-lg mt-1" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-5 w-32 skeleton rounded-lg" />
        <div className="h-4 w-full skeleton rounded-lg" />
        <div className="h-4 w-3/4 skeleton rounded-lg" />
      </div>
      <div className="skeleton border border-border rounded-2xl p-5 h-48" />
    </div>
  );
}
