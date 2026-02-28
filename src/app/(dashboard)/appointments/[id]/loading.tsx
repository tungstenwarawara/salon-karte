export default function AppointmentDetailLoading() {
  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-20 skeleton rounded" />
          <div className="h-7 w-28 skeleton rounded-lg mt-1" />
        </div>
        <div className="h-10 w-16 skeleton rounded-xl" />
      </div>

      {/* ステータス + 日時 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-6 w-20 skeleton rounded-full" />
        <div className="space-y-2">
          <div className="h-4 w-16 skeleton rounded" />
          <div className="h-6 w-48 skeleton rounded" />
          <div className="h-4 w-28 skeleton rounded" />
        </div>
      </div>

      {/* 顧客 */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
        <div className="h-4 w-12 skeleton rounded" />
        <div className="h-5 w-32 skeleton rounded" />
      </div>

      {/* メニュー */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-4 w-24 skeleton rounded" />
        <div className="h-4 w-40 skeleton rounded" />
        <div className="h-4 w-36 skeleton rounded" />
      </div>

      {/* アクション */}
      <div className="h-12 skeleton rounded-xl mt-4" />
    </div>
  );
}
