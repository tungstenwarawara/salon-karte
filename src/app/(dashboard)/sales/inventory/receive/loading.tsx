export default function ReceiveLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 w-28 skeleton rounded-lg" />
        <div className="h-4 w-48 skeleton rounded-lg mt-1" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div className="h-12 skeleton rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 skeleton rounded-xl" />
          <div className="h-12 skeleton rounded-xl" />
        </div>
        <div className="h-12 skeleton rounded-xl" />
      </div>
    </div>
  );
}
