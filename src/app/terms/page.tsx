import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link href="/" className="text-accent text-sm hover:underline">
        ← トップに戻る
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">利用規約</h1>

      <div className="prose prose-sm space-y-6 text-text">
        <section>
          <h2 className="text-lg font-bold mb-2">第1条（適用）</h2>
          <p className="text-sm leading-relaxed">
            本規約は、サロンカルテ（以下「当サービス」）の利用に関する条件を定めるものです。
            ユーザーは、本規約に同意の上、当サービスを利用するものとします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第2条（アカウント登録）</h2>
          <p className="text-sm leading-relaxed">
            ユーザーは、正確な情報を提供してアカウント登録を行うものとします。
            登録情報に変更があった場合は、速やかに更新するものとします。
            アカウントの管理責任はユーザーにあり、第三者への譲渡・共有は禁止します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第3条（サービス内容）</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、エステサロン向けのカルテ管理機能を提供します。
            具体的には、顧客管理、施術記録管理、写真管理等の機能を含みます。
            当サービスの内容は、予告なく変更・追加・廃止される場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第4条（禁止事項）</h2>
          <p className="text-sm leading-relaxed">ユーザーは以下の行為を行ってはなりません。</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>法令または公序良俗に違反する行為</li>
            <li>当サービスの運営を妨害する行為</li>
            <li>他のユーザーの個人情報を不正に収集する行為</li>
            <li>当サービスを不正な目的で利用する行為</li>
            <li>当サービスのリバースエンジニアリング</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第5条（データの取扱い）</h2>
          <p className="text-sm leading-relaxed">
            ユーザーが当サービスに登録した顧客情報・施術記録等のデータの管理責任はユーザーにあります。
            ユーザーは、顧客の個人情報を適切に取り扱い、必要な同意を取得するものとします。
            当サービスは、データのバックアップに努めますが、データの完全な保全を保証するものではありません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第6条（料金・支払い）</h2>
          <p className="text-sm leading-relaxed">
            有料プランの料金は、当サービスのWebサイトに掲載するとおりとします。
            料金の支払いは月額制とし、登録されたクレジットカードにて決済します。
            解約は1ヶ月単位で可能で、解約後も当月末まではサービスを利用できます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第7条（免責事項）</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、その完全性・正確性・有用性等について保証するものではありません。
            当サービスの利用により生じた損害について、当サービスの故意または重大な過失による場合を除き、
            責任を負わないものとします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">第8条（規約の変更）</h2>
          <p className="text-sm leading-relaxed">
            当サービスは、必要に応じて本規約を変更することがあります。
            変更後の規約は、当サービス内での通知をもって効力を生じるものとします。
          </p>
        </section>
      </div>
    </div>
  );
}
