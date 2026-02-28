export default function BookingRulesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-4 w-24 skeleton rounded-lg" />
        <div className="h-7 w-40 skeleton rounded-lg mt-2" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
        <div className="space-y-2">
          <div className="h-4 w-20 skeleton rounded-lg" />
          <div className="h-14 skeleton rounded-xl" />
          <div className="h-14 skeleton rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 skeleton rounded-lg" />
          <div className="h-12 skeleton rounded-xl" />
        </div>
      </div>
      <div className="h-12 skeleton rounded-xl" />
    </div>
  );
}
