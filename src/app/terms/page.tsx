import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link href="/" className="text-accent text-sm hover:underline">
        ← トップに戻る
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">利用規約</h1>
      <p className="text-xs text-text-light mb-6">制定日: 2026年3月1日 / 最終更新日: 2026年3月1日</p>

      <div className="prose prose-sm space-y-6 text-text">
        <section>
          <h2 className="text-lg font-bold mb-2">第1条（適用）</h2>
          <p className="text-sm leading-relaxed">
            本規約は、サロンカルテ（以下「当サービス」）の利用に関する条件を定めるものです。
            ユーザーは、本規約に同意の上、当サービスを利用するものとします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第2条（定義）</h2>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>「当サービス」とは、個人サロン向けカルテ管理Webアプリケーション「サロンカルテ」をいいます</li>
            <li>「ユーザー」とは、当サービスにアカウントを登録したサロンオーナーおよびスタッフをいいます</li>
            <li>「顧客情報」とは、ユーザーが当サービスに登録するサロンの顧客に関する個人情報をいいます</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第3条（アカウント登録）</h2>
          <p className="text-sm leading-relaxed">
            ユーザーは、正確な情報を提供してアカウント登録を行うものとします。
            登録情報に変更があった場合は、速やかに更新するものとします。
            アカウントの管理責任はユーザーにあり、第三者への譲渡・共有は禁止します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第4条（サービス内容）</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、個人サロン向けに以下の機能を提供します。
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>顧客管理（顧客情報の登録・検索・編集）</li>
            <li>施術カルテ管理（施術記録・写真・メモの記録）</li>
            <li>予約管理</li>
            <li>売上管理・経営分析</li>
            <li>物販・在庫管理、回数券管理</li>
            <li>カウンセリングシート（Web問診票）</li>
            <li>LINE連携（予約通知・リマインド送信）</li>
            <li>データのCSVエクスポート・インポート</li>
            <li>年間収支サマリー・会計ソフト連携CSV出力</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">
            当サービスの内容は、予告なく変更・追加・廃止される場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第5条（料金・支払い）</h2>
          <p className="text-sm leading-relaxed">
            当サービスには無料プラン（おためし）と有料プラン（スタンダード）があります。
            各プランの料金・機能は、当サービスのWebサイトに掲載するとおりとします。
            有料プランの料金は月額制とし、決済方法は別途定める方法によるものとします。
            解約はいつでも可能で、解約後も当月末まではサービスを利用できます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第6条（データの取り扱い・ユーザーの責任）</h2>
          <p className="text-sm leading-relaxed">
            ユーザーが当サービスに登録した顧客情報・施術記録等のデータに関して、
            以下の事項を確認し同意するものとします。
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>ユーザーは、自身の顧客の個人情報について個人情報取扱事業者としての責任を負います</li>
            <li>ユーザーは、顧客から個人情報の取得・利用について適切な同意を得るものとします</li>
            <li>特に健康に関する情報（アレルギー、服薬情報等）を登録する場合は、顧客からの明示的な同意が必要です</li>
            <li>データの正確性・最新性の維持はユーザーの責任とします</li>
            <li>当サービスはデータの定期的なバックアップに努めますが、データの完全な保全を保証するものではありません</li>
            <li>重要なデータは、CSVエクスポート機能を利用してユーザー自身でもバックアップを行うことを推奨します</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第7条（禁止事項）</h2>
          <p className="text-sm leading-relaxed">ユーザーは以下の行為を行ってはなりません。</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>法令または公序良俗に違反する行為</li>
            <li>当サービスの運営を妨害する行為</li>
            <li>他のユーザーの個人情報を不正に収集する行為</li>
            <li>当サービスを不正な目的で利用する行為</li>
            <li>当サービスのリバースエンジニアリング</li>
            <li>自動化ツール等を用いた過度なアクセス</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第8条（知的財産権）</h2>
          <p className="text-sm leading-relaxed">
            当サービスに関する著作権、商標権その他の知的財産権は、当サービスの運営者に帰属します。
            ユーザーが当サービスに登録したデータの権利はユーザーに帰属し、
            ユーザーはいつでもCSVエクスポート機能によりデータを取得できます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第9条（免責事項・損害賠償）</h2>
          <ol className="list-decimal list-inside text-sm space-y-2 mt-2">
            <li>
              当サービスは、その完全性・正確性・有用性・特定目的への適合性等について保証するものではありません。
            </li>
            <li>
              当サービスの利用により生じた損害について、当サービスの運営者の故意または重大な過失による場合を除き、
              責任を負わないものとします。
            </li>
            <li>
              当サービスの運営者が損害賠償責任を負う場合、その額は当該ユーザーが過去12ヶ月間に当サービスに支払った金額を上限とします。
              無料プランのユーザーに対しては、いかなる場合も金銭的な損害賠償責任を負わないものとします。
            </li>
            <li>
              天災地変、通信回線の障害、外部サービスの障害等、
              当サービスの責めに帰さない事由による損害については、責任を負いません。
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第10条（サービスの停止・変更・終了）</h2>
          <ol className="list-decimal list-inside text-sm space-y-2 mt-2">
            <li>
              当サービスは、システムの保守・更新、天災地変その他の不可抗力、
              外部サービスの障害等の場合にサービスの一部または全部を一時停止できるものとします。
            </li>
            <li>
              当サービスを終了する場合は、3ヶ月前までにサービス内の通知またはメールにてお知らせします。
            </li>
            <li>
              サービス終了時には、CSVエクスポート機能によるデータの取得期間を設けます。
              データの取得期間終了後、当サービスに保存されたデータは削除されます。
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第11条（退会）</h2>
          <p className="text-sm leading-relaxed">
            ユーザーは、設定画面からいつでも退会できます。
            アカウントを削除した場合、当該サロンに紐づく全てのデータ（顧客情報、施術記録、写真、予約、売上データ等）が
            完全に削除され、復元はできません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第12条（規約の変更）</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、必要に応じて本規約を変更することがあります。
            変更後の規約は、サービス内の通知またはメールでの告知をもって効力を生じるものとします。
            変更後も当サービスを利用した場合は、変更後の規約に同意したものとみなします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第13条（準拠法・管轄）</h2>
          <p className="text-sm leading-relaxed">
            本規約の解釈は日本法に準拠するものとします。
            当サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>
      </div>
    </div>
  );
}
