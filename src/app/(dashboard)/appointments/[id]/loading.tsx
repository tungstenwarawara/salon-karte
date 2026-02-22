export default function AppointmentDetailLoading() {
  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-20 bg-border rounded animate-pulse" />
          <div className="h-7 w-28 bg-border rounded-lg animate-pulse mt-1" />
        </div>
        <div className="h-10 w-16 bg-border rounded-xl animate-pulse" />
      </div>

      {/* ステータス + 日時 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-6 w-20 bg-border rounded-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-16 bg-border rounded animate-pulse" />
          <div className="h-6 w-48 bg-border rounded animate-pulse" />
          <div className="h-4 w-28 bg-border rounded animate-pulse" />
        </div>
      </div>

      {/* 顧客 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
        <div className="h-4 w-12 bg-border rounded animate-pulse" />
        <div className="h-5 w-32 bg-border rounded animate-pulse" />
      </div>

      {/* メニュー */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-4 w-24 bg-border rounded animate-pulse" />
        <div className="h-4 w-40 bg-border rounded animate-pulse" />
        <div className="h-4 w-36 bg-border rounded animate-pulse" />
      </div>

      {/* アクション */}
      <div className="h-12 bg-border rounded-xl animate-pulse mt-4" />
    </div>
  );
}
