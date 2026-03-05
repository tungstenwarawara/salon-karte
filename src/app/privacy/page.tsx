import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link href="/" className="text-accent text-sm hover:underline">
        ← トップに戻る
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">プライバシーポリシー</h1>
      <p className="text-xs text-text-light mb-6">制定日: 2026年3月1日 / 最終更新日: 2026年3月5日</p>

      <div className="prose prose-sm space-y-6 text-text">
        <section>
          <h2 className="text-lg font-bold mb-2">1. 事業者情報</h2>
          <p className="text-sm leading-relaxed">
            サロンカルテ（以下「当サービス」）は、個人が運営するWebサービスです。
            事業者の氏名・住所・電話番号については、請求があれば遅滞なく開示いたします。
          </p>
          <p className="text-sm leading-relaxed mt-1">
            お問い合わせ先: <a href="mailto:support@salonkarte.com" className="text-accent hover:underline">support@salonkarte.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">2. 取得する個人情報</h2>
          <p className="text-sm leading-relaxed">当サービスは、サービスの提供にあたり、以下の個人情報を取得します。</p>

          <h3 className="text-base font-bold mt-3 mb-1">2-1. サロンオーナー（ユーザー）の情報</h3>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>メールアドレス、パスワード（認証用）</li>
            <li>サロン情報（サロン名、電話番号、住所）</li>
          </ul>

          <h3 className="text-base font-bold mt-3 mb-1">2-2. サロンの顧客情報（ユーザーが登録）</h3>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>氏名、フリガナ、生年月日、電話番号、メールアドレス、住所</li>
            <li>施術記録（施術内容、施術写真、メモ）</li>
            <li>予約情報、物販・回数券の購入履歴</li>
          </ul>

          <h3 className="text-base font-bold mt-3 mb-1">2-3. 要配慮個人情報（健康に関する情報）</h3>
          <p className="text-sm leading-relaxed">
            カウンセリングシート機能において、以下の健康に関する情報を取得する場合があります。
            これらは施術の安全な提供を目的としており、ご本人の明示的な同意を得た上で取得します。
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>アレルギー情報、服用中の薬</li>
            <li>健康状態（妊娠中・授乳中・通院中・アトピー・金属アレルギー等）</li>
            <li>身長・体重</li>
            <li>肌の状態に関する記録</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">3. 利用目的</h2>
          <p className="text-sm leading-relaxed">取得した個人情報は、以下の目的でのみ利用します。</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>当サービスの提供・運営（顧客管理、カルテ管理、予約管理、売上管理等）</li>
            <li>ユーザー認証・アカウント管理</li>
            <li>Web予約時の確認メール・サロンオーナーへの予約通知メールの送信</li>
            <li>LINE連携機能における予約通知・リマインドの送信</li>
            <li>サービスの改善・不具合の修正</li>
            <li>お問い合わせへの対応</li>
            <li>利用規約に違反する行為への対応</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">4. 第三者提供・業務委託</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
            ただし、サービスの運営にあたり、以下の外部サービスにデータの処理を委託しています。
          </p>
          <div className="mt-3 space-y-3">
            <div className="bg-background rounded-lg p-3">
              <p className="text-sm font-medium">Supabase（データベース・認証・ファイルストレージ）</p>
              <p className="text-xs text-text-light mt-1">
                提供元: Supabase Inc.（米国）/ データ保管場所: 日本（東京リージョン: ap-northeast-1）
              </p>
              <p className="text-xs text-text-light">
                用途: ユーザー認証、データベース管理、施術写真の保存
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-sm font-medium">Vercel（Webアプリケーションホスティング・アクセス解析）</p>
              <p className="text-xs text-text-light mt-1">
                提供元: Vercel Inc.（米国）/ 処理場所: グローバルCDN
              </p>
              <p className="text-xs text-text-light">
                用途: Webアプリケーションの配信、アクセス解析（Vercel Analytics）。
                アクセス解析ではページビュー数等の統計情報を収集しますが、個人を特定する情報は含まれません。
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-sm font-medium">Resend（メール送信）</p>
              <p className="text-xs text-text-light mt-1">
                提供元: Resend Inc.（米国）/ データ処理場所: 日本（東京リージョン: ap-northeast-1）
              </p>
              <p className="text-xs text-text-light">
                用途: Web予約時の確認メール・予約通知メールの送信。
                送信に必要な情報（メールアドレス、お名前、予約内容）のみを送信処理のために一時的に使用し、送信ログは30日で自動削除されます。
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-sm font-medium">Sentry（エラー監視）</p>
              <p className="text-xs text-text-light mt-1">
                提供元: Functional Software Inc.（米国）/ 処理場所: 米国
              </p>
              <p className="text-xs text-text-light">
                用途: アプリケーションのエラー検知・修正。
                氏名・メールアドレス・電話番号等の個人情報はエラーデータから自動的に除去した上で送信しています。
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">5. 外国への個人データの移転</h2>
          <p className="text-sm leading-relaxed">
            上記の外部サービスのうち、Vercel Inc. および Functional Software Inc.（Sentry）は
            米国に所在する法人であり、データの一部が米国で処理される場合があります。
          </p>
          <p className="text-sm leading-relaxed mt-2">
            米国には、個人情報の保護に関する連邦レベルの包括的な法律は存在しませんが、
            各州法（カリフォルニア州消費者プライバシー法（CCPA）等）やFTC法による規制が行われています。
            日本の個人情報保護法が求める水準と同等の保護が保証されているとは限りませんが、
            当サービスは各委託先との間でデータ処理に関する契約を締結し、適切な安全管理措置を講じています。
          </p>
          <p className="text-sm leading-relaxed mt-2">
            なお、Supabase のデータベースおよびストレージは日本国内（東京リージョン）で運用しており、
            顧客の個人情報・施術記録・写真等の主要データは日本国内に保管されます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">6. データの保管・安全管理</h2>
          <p className="text-sm leading-relaxed">
            ユーザーおよび顧客の個人情報は、日本国内（東京）のデータセンターに保管されます。
            当サービスは以下のセキュリティ対策を講じています。
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>通信の暗号化（SSL/TLS）</li>
            <li>行レベルセキュリティ（RLS）により、各サロンオーナーは自身のデータにのみアクセス可能</li>
            <li>LINE連携のAPIキー等の機密情報はAES-256-GCMで暗号化して保存</li>
            <li>施術写真は非公開ストレージに保存され、時間制限付きURLでのみアクセス可能</li>
          </ul>

          <h3 className="text-base font-bold mt-4 mb-1">6-1. データの保持期間</h3>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>利用中: ユーザーがアカウントを保持している間、登録データ（顧客情報、施術記録、予約、売上等）を保持します</li>
            <li>退会時: アカウント削除により、ユーザーに紐づく全てのデータ（顧客情報、施術記録、写真、予約、売上データ等）を直ちに削除します</li>
            <li>バックアップ: データベースの自動バックアップに含まれるデータは、バックアップの保持期間（最大30日間）経過後に自動的に削除されます</li>
            <li>エラーログ: Sentryに送信されたエラーデータは30日間保持された後、自動削除されます</li>
            <li>メール送信ログ: Resendの送信ログは30日間保持された後、自動削除されます</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">7. Cookie等の利用・アクセス解析</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、以下の目的でCookieおよび類似技術を使用します。
          </p>

          <h3 className="text-base font-bold mt-3 mb-1">7-1. 必須Cookie</h3>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>認証状態の維持（ログインセッション管理）— サービスの利用に必須</li>
          </ul>

          <h3 className="text-base font-bold mt-3 mb-1">7-2. アクセス解析</h3>
          <p className="text-sm leading-relaxed">
            当サービスでは、サービスの改善を目的として以下のアクセス解析ツールを使用しています。
          </p>
          <div className="mt-2 space-y-3">
            <div className="bg-background rounded-lg p-3">
              <p className="text-sm font-medium">Google Analytics 4（GA4）</p>
              <p className="text-xs text-text-light mt-1">
                提供元: Google LLC（米国）
              </p>
              <p className="text-xs text-text-light">
                収集データ: ページビュー数、セッション時間、参照元URL、使用デバイス・ブラウザ情報等の匿名化された統計データ。
                個人を特定する情報は収集しません。
              </p>
              <p className="text-xs text-text-light">
                Cookieの種類: _ga（有効期限: 2年）、_ga_*（有効期限: 2年）
              </p>
              <p className="text-xs text-text-light">
                Googleのプライバシーポリシー:{" "}
                <a href="https://policies.google.com/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                  https://policies.google.com/privacy
                </a>
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-sm font-medium">Vercel Analytics</p>
              <p className="text-xs text-text-light mt-1">
                提供元: Vercel Inc.（米国）
              </p>
              <p className="text-xs text-text-light">
                収集データ: ページビュー数、パフォーマンス指標等の統計情報。個人を特定する情報は含まれません。
              </p>
            </div>
          </div>

          <h3 className="text-base font-bold mt-3 mb-1">7-3. Cookieの管理</h3>
          <p className="text-sm leading-relaxed">
            ユーザーはブラウザの設定によりCookieを拒否できますが、
            必須Cookie（認証用）を拒否した場合はサービスにログインできなくなります。
            アクセス解析用のCookieを拒否した場合でも、サービスの利用には影響ありません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">8. ユーザーの権利（開示・訂正・削除）</h2>
          <p className="text-sm leading-relaxed">
            ユーザーは、当サービスが保有する自身の個人情報について、以下の権利を有します。
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>開示の請求: ご自身の個人情報の開示を求めることができます</li>
            <li>訂正の請求: 登録情報は設定画面からいつでもご自身で訂正できます</li>
            <li>削除の請求: 設定画面からいつでもアカウントおよび全関連データ（顧客情報、施術記録、写真等）を削除できます</li>
            <li>利用停止の請求: 個人情報の利用停止を求めることができます</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">
            削除以外の請求は、下記のお問い合わせ先までメールにてご連絡ください。
            ご本人確認の上、合理的な期間内に対応いたします。
          </p>
          <p className="text-sm leading-relaxed mt-1">
            お問い合わせ先: <a href="mailto:support@salonkarte.com" className="text-accent hover:underline">support@salonkarte.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">9. サロンオーナーの責任</h2>
          <p className="text-sm leading-relaxed">
            サロンオーナー（ユーザー）が当サービスに登録する顧客の個人情報については、
            サロンオーナーが個人情報取扱事業者としての責任を負います。
            サロンオーナーは、自身の顧客から個人情報の取得・利用について適切な同意を得た上で、
            当サービスに登録するものとします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">10. プライバシーポリシーの変更</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、法令の改正やサービス内容の変更に伴い、本ポリシーを変更することがあります。
            重要な変更がある場合は、サービス内の通知またはメールにてお知らせします。
            変更後のポリシーは、本ページに掲載した時点で効力を生じるものとします。
          </p>
        </section>
      </div>
    </div>
  );
}
