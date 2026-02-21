import Link from "next/link";

export function CsvResultStep({
  successCount,
  failedCount,
  errors,
  primaryAction,
  secondaryAction,
  hubAction,
}: {
  successCount: number;
  failedCount: number;
  errors: string[];
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; onClick: () => void };
  hubAction?: { label: string; href: string };
}) {
  return (
    <div className="space-y-4">
      {/* 成功 */}
      {successCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-success">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-lg font-bold text-success">{successCount}件を登録しました</p>
        </div>
      )}

      {/* 失敗 */}
      {failedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-red-700">{failedCount}件が失敗しました</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {errors.map((err, i) => (
              <p key={i} className="text-xs text-red-600">{err}</p>
            ))}
          </div>
        </div>
      )}

      {/* アクション */}
      <div className="space-y-2 pt-2">
        <Link
          href={primaryAction.href}
          className="block w-full bg-accent text-white text-sm font-medium py-3 rounded-xl text-center hover:bg-accent/90 transition-colors"
        >
          {primaryAction.label}
        </Link>
        <button
          onClick={secondaryAction.onClick}
          className="block w-full border border-border text-sm font-medium py-3 rounded-xl text-center hover:bg-background transition-colors"
        >
          {secondaryAction.label}
        </button>
        {hubAction && (
          <Link
            href={hubAction.href}
            className="block w-full text-sm text-accent text-center py-2 hover:underline"
          >
            {hubAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}
