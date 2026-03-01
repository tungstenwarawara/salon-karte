export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <div className="w-full max-w-lg mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
