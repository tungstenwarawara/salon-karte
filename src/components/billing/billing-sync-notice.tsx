/**
 * 決済完了直後の反映待ち／反映失敗の案内。
 *
 * Stripe は決済直後に画面を戻すが、プラン反映は Webhook 受信後になる。
 * この数秒間に「おためしプラン」や使用状況バーを見せると、
 * 支払い済みのお客様が「課金されていない」と誤解するため、専用の表示に差し替える。
 */
export function BillingSyncNotice({ timedOut }: { timedOut: boolean }) {
  if (timedOut) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 space-y-2">
        <p className="font-bold text-yellow-900">
          反映に時間がかかっています
        </p>
        <p className="text-sm text-yellow-900 leading-relaxed">
          お支払いは完了しています。プランへの反映が少し遅れているようです。
          <br />
          数分おいてからページを再読み込みしてください。
        </p>
        <p className="text-sm text-yellow-900 leading-relaxed">
          反映されない場合は、お手数ですが
          <a
            href="mailto:support@salonkarte.com"
            className="underline font-medium"
          >
            support@salonkarte.com
          </a>
          までご連絡ください。二重にお支払いいただく必要はありません。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="font-bold">お手続きを反映しています</p>
      </div>
      <p className="text-sm text-text-light leading-relaxed">
        お支払いが完了しました。プランの切り替えを反映しています。
        <br />
        このまま少しお待ちください（最大20秒ほど）。
      </p>
    </div>
  );
}
