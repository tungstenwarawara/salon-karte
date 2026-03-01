import Link from "next/link";

export default function TokushoPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link href="/" className="text-accent text-sm hover:underline">
        ← トップに戻る
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">特定商取引法に基づく表記</h1>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            <tr>
              <td className="px-4 py-3 font-medium bg-background w-1/3">事業者名</td>
              <td className="px-4 py-3">請求があれば遅滞なく開示いたします</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium bg-background">所在地</td>
              <td className="px-4 py-3">請求があれば遅滞なく開示いたします</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium bg-background">電話番号</td>
              <td className="px-4 py-3">請求があれば遅滞なく開示いたします</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium bg-background">メールアドレス</td>
              <td className="px-4 py-3">
                <a href="mailto:support@salon-karte.dev" className="text-accent hover:underline">
                  support@salon-karte.dev
                </a>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium bg-background">サービス名</td>
              <td className="px-4 py-3">サロンカルテ</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium bg-background">販売価格</td>
              <td className="px-4 py-3">
                <ul className="space-y-1">
                  <li>おためしプラン: 無料</li>
                  <li>スタンダードプラン: 月額2,980円（税込）</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium bg-background">支払方法</td>
              <td className="px-4 py-3">クレジットカード決済</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium bg-background">支払時期</td>
              <td className="px-4 py-3">申込時および毎月の自動更新時</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium bg-background">役務の提供時期</td>
              <td className="px-4 py-3">申込手続き完了後、直ちにご利用いただけます</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium bg-background">解約・返金</td>
              <td className="px-4 py-3">
                解約はいつでも可能です。解約後も当月末まではサービスをご利用いただけます。
                日割り返金は行っておりません。
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium bg-background">動作環境</td>
              <td className="px-4 py-3">
                Google Chrome、Safari、Microsoft Edge の最新版。
                スマートフォン・タブレット・パソコンに対応。
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
