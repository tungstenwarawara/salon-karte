import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link href="/" className="text-accent text-sm hover:underline">
        &larr; トップに戻る
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">お問い合わせ</h1>

      <div className="space-y-6">
        <section className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">メールでのお問い合わせ</h2>
          <p className="text-sm text-text-light leading-relaxed">
            ご質問、ご要望、不具合のご報告など、お気軽にご連絡ください。
            通常1〜2営業日以内にご返信いたします。
          </p>
          <a
            href="mailto:support@salonkarte.com"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-3 min-h-[48px] transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            support@salonkarte.com
          </a>
        </section>

        <section className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">お問い合わせの際にお伝えいただきたいこと</h2>
          <ul className="text-sm text-text-light space-y-2 list-disc list-inside">
            <li>ご利用中のサロン名（登録済みの場合）</li>
            <li>ご質問・ご要望の内容</li>
            <li>不具合の場合: 発生した画面、操作手順、エラーメッセージ</li>
            <li>スクリーンショットがあればご添付ください</li>
          </ul>
        </section>

        <section className="bg-background rounded-2xl p-6">
          <p className="text-sm text-text-light leading-relaxed">
            サロンカルテの使い方については、
            <Link href="/dashboard" className="text-accent hover:underline">
              ダッシュボード
            </Link>
            内の「使い方ガイド」もご参照ください。
          </p>
        </section>
      </div>
    </div>
  );
}
