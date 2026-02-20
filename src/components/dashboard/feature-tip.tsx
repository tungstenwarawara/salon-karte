export function FeatureTip({
  allSetupDone,
  lapsedCount,
}: {
  allSetupDone: boolean;
  lapsedCount: number;
}) {
  if (!allSetupDone) return null;

  return (
    <div className="bg-accent/5 border border-accent/15 rounded-2xl p-4">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-accent">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">活用ヒント</p>
          <p className="text-xs text-text-light mt-0.5">
            {lapsedCount > 0
              ? `${lapsedCount}名のお客様が60日以上ご来店がありません。顧客一覧から確認してフォローしましょう。`
              : "ビフォーアフター写真をカルテに記録すると、施術経過が一目でわかります。"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
