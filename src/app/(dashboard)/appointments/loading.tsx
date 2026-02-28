import { LoadingIllustration } from "@/components/ui/loading-illustration";

export default function AppointmentsLoading() {
  return (
    <LoadingIllustration type="calendar">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 skeleton rounded-lg" />
        <div className="h-10 w-24 skeleton rounded-xl" />
      </div>
      {/* カレンダー */}
      <div className="skeleton border border-border rounded-xl h-48 mt-4" />
      {/* 予約カード */}
      <div className="space-y-2 mt-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton border border-border rounded-xl p-3 h-20" />
        ))}
      </div>
    </LoadingIllustration>
  );
}
