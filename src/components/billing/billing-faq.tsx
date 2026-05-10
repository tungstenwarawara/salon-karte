"use client";

/** 料金プランページの FAQ セクション */
export function BillingFaq() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-2">
      <h3 className="font-bold">❓ よくある質問</h3>

      <details className="group">
        <summary className="font-medium text-sm py-2 cursor-pointer min-h-[44px] flex items-center">
          制限を超えたらどうなりますか？
        </summary>
        <p className="text-sm text-text-light pl-4 pb-2">
          既存のデータ（顧客・カルテ・予約）は引き続き閲覧・編集できますが、
          新しい登録ができなくなります。スタンダードプランにアップグレードすれば即座に解除されます。
        </p>
      </details>

      <details className="group">
        <summary className="font-medium text-sm py-2 cursor-pointer min-h-[44px] flex items-center">
          解約したらデータは消えますか？
        </summary>
        <p className="text-sm text-text-light pl-4 pb-2">
          解約後もデータは残ります。スタンダードプランの期間末まではすべての機能を使え、
          その後はおためしプランに自動的に戻ります（顧客50人・カルテ100件等の制限内で利用可能）。
        </p>
      </details>

      <details className="group">
        <summary className="font-medium text-sm py-2 cursor-pointer min-h-[44px] flex items-center">
          無料に戻せますか？
        </summary>
        <p className="text-sm text-text-light pl-4 pb-2">
          「プラン・支払い方法を管理」から解約すれば、期間末でおためしプランに戻ります。
          データはそのまま保持されます。
        </p>
      </details>

      <details className="group">
        <summary className="font-medium text-sm py-2 cursor-pointer min-h-[44px] flex items-center">
          クレジットカード以外の支払い方法は？
        </summary>
        <p className="text-sm text-text-light pl-4 pb-2">
          現在はクレジットカードのみ対応しています（Visa, Mastercard, JCB, AMEX, Discover）。
          銀行振込・コンビニ払い等は今後の対応予定です。
        </p>
      </details>

      <details className="group">
        <summary className="font-medium text-sm py-2 cursor-pointer min-h-[44px] flex items-center">
          紹介特典について
        </summary>
        <p className="text-sm text-text-light pl-4 pb-2">
          紹介リンク経由でサインアップした方は、アップグレード時に最初の30日間が無料になります。
          紹介してくださった方には、被紹介者が初回課金された時点で、次回請求から1ヶ月分（¥2,980）が控除されます。
        </p>
      </details>
    </div>
  );
}
