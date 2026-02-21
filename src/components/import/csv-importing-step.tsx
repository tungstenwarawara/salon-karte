export function CsvImportingStep({
  progress,
  total,
  label = "取り込み中...",
}: {
  progress: number;
  total: number;
  label?: string;
}) {
  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* スピナー */}
      <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin" />

      <div className="text-center space-y-1">
        <p className="font-bold">{label}</p>
        <p className="text-sm text-text-light">
          {progress} / {total} 件
        </p>
      </div>

      {/* プログレスバー */}
      <div className="w-full max-w-xs">
        <div className="w-full bg-border rounded-full h-2">
          <div
            className="bg-accent rounded-full h-2 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
