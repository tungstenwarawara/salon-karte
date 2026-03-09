export default function BillingLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 skeleton rounded-lg" />
      <div className="skeleton border border-border rounded-2xl p-5 h-32" />
      <div className="skeleton border border-border rounded-2xl p-5 h-24" />
    </div>
  );
}
