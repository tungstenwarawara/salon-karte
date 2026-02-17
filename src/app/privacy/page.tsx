import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link href="/" className="text-accent text-sm hover:underline">
        ← トップに戻る
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">プライバシーポリシー</h1>

      <div className="prose prose-sm space-y-6 text-text">
        <section>
          <h2 className="text-lg font-bold mb-2">1. 個人情報の取得</h2>
          <p className="text-sm leading-relaxed">
            サロンカルテ（以下「当サービス」）は、サービスの提供にあたり、以下の個人情報を取得します。
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>サロンオーナーのメールアドレス、パスワード</li>
            <li>サロン情報（サロン名、電話番号、住所）</li>
            <li>顧客情報（氏名、カナ、生年月日、電話番号、メールアドレス、肌質、アレルギー情報等）</li>
            <li>施術記録（施術内容、写真、メモ等）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">2. 個人情報の利用目的</h2>
          <p className="text-sm leading-relaxed">取得した個人情報は、以下の目的で利用します。</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>当サービスの提供・運営</li>
            <li>ユーザー認証・アカウント管理</li>
            <li>サービスの改善・新機能の開発</li>
            <li>お問い合わせへの対応</li>
            <li>利用規約に違反する行為への対応</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">3. 個人情報の第三者提供</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">4. 個人情報の管理</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、個人情報の漏洩、滅失、毀損の防止のため、適切なセキュリティ対策を講じます。
            データはSupabaseのセキュアなインフラストラクチャ上で管理され、行レベルセキュリティ（RLS）により、
            各サロンオーナーは自身のデータにのみアクセスできます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">5. 個人情報の削除</h2>
          <p className="text-sm leading-relaxed">
            ユーザーは、いつでも自身のアカウントおよび関連データの削除を請求できます。
            削除請求を受けた場合、合理的な期間内にデータを削除します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">6. Cookie等の利用</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、認証状態の維持のためにCookieを使用します。
            ユーザーはブラウザの設定によりCookieを拒否できますが、その場合サービスの一部が利用できなくなる場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">7. プライバシーポリシーの変更</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、必要に応じて本ポリシーを変更することがあります。
            重要な変更がある場合は、サービス内で通知します。
          </p>
        </section>
      </div>
    </div>
  );
}
