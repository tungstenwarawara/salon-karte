import Link from "next/link";

/**
 * カルテ保存直後に表示する次回予約の提案バナー
 * 施術直後（お客様が目の前にいる瞬間）が次回予約の最も決まりやすいタイミング。
 * 次回予約が入ると 前日リマインド → 当日ダッシュボード表示 → カルテプリフィル の循環が回り出す。
 */
export function NextAppointmentPrompt({ customerId }: { customerId: string }) {
  return (
    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-bold">カルテを保存しました。次回のご予約も入れますか？</p>
        <p className="text-xs text-text-light mt-0.5">今決めておくと、前日に自動でリマインドをお送りできます</p>
      </div>
      <Link
        href={`/appointments/new?customer=${customerId}`}
        className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center justify-center shrink-0"
      >
        + 次回予約を登録
      </Link>
    </div>
  );
}
