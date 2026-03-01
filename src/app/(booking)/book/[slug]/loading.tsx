export default function BookingLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-border/30 rounded-xl w-48 mx-auto" />
      <div className="h-4 bg-border/30 rounded w-32 mx-auto" />
      <div className="space-y-3 mt-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-border/30 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
