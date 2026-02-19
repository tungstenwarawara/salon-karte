import Link from "next/link";

function StepCard({
  number,
  title,
  description,
  link,
  linkLabel,
}: {
  number: number;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center mt-0.5">
          {number}
        </span>
        <div className="flex-1">
          <h4 className="font-bold text-sm">{title}</h4>
          <p className="text-sm text-text-light mt-1 leading-relaxed">
            {description}
          </p>
          <Link
            href={link}
            className="inline-block mt-2 text-sm text-accent hover:underline font-medium"
          >
            {linkLabel} →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-bold text-base flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-xs text-text-light mt-1 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div>
        <h2 className="text-xl font-bold">使い方ガイド</h2>
        <p className="text-text-light text-sm mt-1">
          サロンカルテの基本的な使い方をご紹介します
        </p>
      </div>

      {/* はじめに */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
        <h3 className="font-bold text-sm text-accent">
          サロンカルテでできること
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-text-light">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">&#10003;</span>
            <span>お客様の情報・施術履歴をカルテとして管理</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">&#10003;</span>
            <span>施術前後の写真をビフォーアフターで記録</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">&#10003;</span>
            <span>電話・LINE・ホットペッパー等すべての予約を一元管理</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">&#10003;</span>
            <span>来店が途切れたお客様を自動でお知らせ</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">&#10003;</span>
            <span>物販の購入履歴と回数券の残数を管理</span>
          </li>
        </ul>
      </div>

      {/* 1日の流れ */}
      <Section title="1日の使い方（基本フロー）" icon="&#128197;">
        <div className="space-y-3">
          <StepCard
            number={1}
            title="朝：ダッシュボードで今日の予約を確認"
            description="ログインすると、今日の予約一覧が表示されます。お客様の名前・メニュー・時間をひと目で確認できます。"
            link="/dashboard"
            linkLabel="ダッシュボードを開く"
          />
          <StepCard
            number={2}
            title="来店前：カルテで前回の施術内容を確認"
            description="予約のお客様名をタップすると、顧客詳細画面に移動します。前回の施術内容・施術前の状態・次回への申し送りを確認できます。"
            link="/customers"
            linkLabel="顧客一覧を開く"
          />
          <StepCard
            number={3}
            title="施術後：カルテを記入"
            description="顧客詳細画面の「+ カルテ作成」から、今日の施術内容を記録します。写真も一緒に保存できます。"
            link="/customers"
            linkLabel="顧客を選んで記録する"
          />
          <StepCard
            number={4}
            title="次回予約を登録"
            description="次回の来店日が決まったら、予約を登録しておきましょう。ダッシュボードに自動で表示されます。"
            link="/appointments/new"
            linkLabel="予約を登録する"
          />
        </div>
      </Section>

      {/* 初期設定 */}
      <Section title="最初にやること" icon="&#9881;">
        <div className="space-y-3">
          <StepCard
            number={1}
            title="施術メニューを登録する"
            description="サロンで提供しているメニュー（フェイシャル、ボディケアなど）を登録しておくと、カルテ作成時にワンタップで選べます。"
            link="/settings/menus"
            linkLabel="メニューを登録する"
          />
          <StepCard
            number={2}
            title="お客様を登録する"
            description="既存のお客様の情報を登録しましょう。名前（カナ）、電話番号、肌質、アレルギーなどを入力できます。"
            link="/customers/new"
            linkLabel="顧客を登録する"
          />
          <StepCard
            number={3}
            title="予約を入れてみる"
            description="お客様の予約を登録してみましょう。ホットペッパー、電話、LINEなど予約元も記録できます。"
            link="/appointments/new"
            linkLabel="予約を登録する"
          />
        </div>
      </Section>

      {/* 各機能の説明 */}
      <Section title="機能の詳細" icon="&#128218;">
        <div className="space-y-3">
          <FeatureCard
            title="顧客管理"
            description="お客様の基本情報（名前、電話番号、肌質、アレルギーなど）を管理します。カナ検索で素早く見つけられます。顧客一覧では来店回数や最終来店日も表示されます。"
          />
          <FeatureCard
            title="施術記録（カルテ）"
            description="施術日・メニュー・使用した化粧品・施術前の状態・施術後の経過・会話メモ・注意事項・次回への申し送りを記録できます。お客様ごとに時系列で確認できます。"
          />
          <FeatureCard
            title="写真管理"
            description="施術前後の写真を記録できます。スマホのカメラで直接撮影、またはギャラリーから選択できます。ビフォーアフターの比較表示にも対応しています。写真の位置情報は自動的に除去されます。"
          />
          <FeatureCard
            title="予約管理"
            description="日付・時間・お客様・メニューを指定して予約を登録します。メニューは複数選択可能で、終了時間は合計所要時間から自動計算されます。予約元（ホットペッパー/電話/LINE/直接/その他）も記録できます。"
          />
          <FeatureCard
            title="来店分析・離脱アラート"
            description="60日以上来店のないお客様を「ご無沙汰のお客様」としてダッシュボードに表示します。フォローのタイミングを逃しません。"
          />
          <FeatureCard
            title="物販購入管理"
            description="お客様ごとに物販・商品の購入履歴を記録できます。商品名・数量・金額を管理し、合計金額も自動計算されます。顧客詳細画面から登録・確認できます。"
          />
          <FeatureCard
            title="コースチケット（回数券）"
            description="コースや回数券の残り回数を管理できます。来店時にワンタップで1回消化でき、残数がひと目でわかります。有効期限の設定にも対応しています。"
          />
        </div>
      </Section>

      {/* セキュリティ */}
      <Section title="セキュリティについて" icon="&#128274;">
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm text-text-light leading-relaxed">
            サロンカルテはお客様の大切な個人情報をお預かりしています。
            以下の対策で安全にデータを保護しています。
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">&#128994;</span>
              <span>
                <strong>通信の暗号化</strong>
                ：すべてのデータはHTTPS（SSL/TLS）で暗号化されて送受信されます
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">&#128994;</span>
              <span>
                <strong>アクセス制御</strong>
                ：他のサロンのデータは一切閲覧・編集できません
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">&#128994;</span>
              <span>
                <strong>写真の保護</strong>
                ：施術写真は暗号化された非公開ストレージに保存され、1時間で期限切れになる一時URLでのみ表示されます
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success mt-0.5">&#128994;</span>
              <span>
                <strong>位置情報の除去</strong>
                ：写真に含まれるGPS位置情報やデバイス情報は、アップロード時に自動的に除去されます
              </span>
            </li>
          </ul>
        </div>
      </Section>

      {/* よくある質問 */}
      <Section title="よくある質問" icon="&#10067;">
        <div className="space-y-3">
          <details className="bg-surface border border-border rounded-xl overflow-hidden group">
            <summary className="font-medium text-sm p-4 cursor-pointer hover:bg-background transition-colors list-none flex items-center justify-between">
              <span>写真はどこに保存されますか？</span>
              <span className="text-text-light text-xs group-open:rotate-180 transition-transform">
                &#9660;
              </span>
            </summary>
            <div className="px-4 pb-4 text-sm text-text-light leading-relaxed">
              写真はクラウド上の暗号化された非公開ストレージに安全に保存されます。URLを知っていても直接アクセスすることはできず、ログインしたご本人のみが閲覧可能です。
            </div>
          </details>

          <details className="bg-surface border border-border rounded-xl overflow-hidden group">
            <summary className="font-medium text-sm p-4 cursor-pointer hover:bg-background transition-colors list-none flex items-center justify-between">
              <span>スマホでもパソコンでも使えますか？</span>
              <span className="text-text-light text-xs group-open:rotate-180 transition-transform">
                &#9660;
              </span>
            </summary>
            <div className="px-4 pb-4 text-sm text-text-light leading-relaxed">
              はい、スマホ・タブレット・パソコンのすべてに対応しています。スマホでの操作に最適化されているので、施術の合間にサッと記録できます。
            </div>
          </details>

          <details className="bg-surface border border-border rounded-xl overflow-hidden group">
            <summary className="font-medium text-sm p-4 cursor-pointer hover:bg-background transition-colors list-none flex items-center justify-between">
              <span>顧客データを削除したらどうなりますか？</span>
              <span className="text-text-light text-xs group-open:rotate-180 transition-transform">
                &#9660;
              </span>
            </summary>
            <div className="px-4 pb-4 text-sm text-text-light leading-relaxed">
              顧客データを削除すると、その顧客に紐づく施術記録・写真・予約もすべて完全に削除されます。この操作は取り消せないため、慎重に行ってください。
            </div>
          </details>

          <details className="bg-surface border border-border rounded-xl overflow-hidden group">
            <summary className="font-medium text-sm p-4 cursor-pointer hover:bg-background transition-colors list-none flex items-center justify-between">
              <span>ホットペッパーとの連携はできますか？</span>
              <span className="text-text-light text-xs group-open:rotate-180 transition-transform">
                &#9660;
              </span>
            </summary>
            <div className="px-4 pb-4 text-sm text-text-light leading-relaxed">
              自動連携には対応していませんが、ホットペッパーで受けた予約を手動で登録して一元管理できます。予約元に「ホットペッパー」を選択すると、どのチャネルからの予約かも記録できます。
            </div>
          </details>

          <details className="bg-surface border border-border rounded-xl overflow-hidden group">
            <summary className="font-medium text-sm p-4 cursor-pointer hover:bg-background transition-colors list-none flex items-center justify-between">
              <span>写真はどのくらい保存できますか？</span>
              <span className="text-text-light text-xs group-open:rotate-180 transition-transform">
                &#9660;
              </span>
            </summary>
            <div className="px-4 pb-4 text-sm text-text-light leading-relaxed">
              基本プランでは5GBまで保存できます。1枚あたり約2〜5MBとして、約1,000〜2,500枚の写真を保存可能です。JPEG、PNG、WebP、HEIC形式に対応しています。
            </div>
          </details>
        </div>
      </Section>

      {/* 料金プラン */}
      <Section title="料金プラン" icon="&#128176;">
        <div className="space-y-4">
          {/* テスター特典 */}
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                テスター特典
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              テスター期間中は<strong>全機能を無料</strong>でお使いいただけます。
              正式リリース後も、オプション機能は<strong>3ヶ月間無料</strong>でお試しいただけます。
            </p>
          </div>

          {/* 基本プラン */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm">基本プラン</h4>
              <div className="text-right">
                <span className="text-xl font-bold text-accent">2,980</span>
                <span className="text-xs text-text-light">円/月（税込）</span>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm text-text-light">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span>顧客管理（人数無制限）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span>施術記録（カルテ）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span>施術写真の保存（5GB）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span>簡易予約管理</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span>来店分析・離脱アラート</span>
              </li>
            </ul>
          </div>

          {/* お試しプラン */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm">お試しプラン</h4>
              <div className="text-right">
                <span className="text-xl font-bold">0</span>
                <span className="text-xs text-text-light">円</span>
              </div>
            </div>
            <p className="text-sm text-text-light">
              顧客10件まで。写真保存・予約管理なし。まずは試してみたい方向け。
            </p>
          </div>

          {/* 他社比較 */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h4 className="font-bold text-sm mb-3">他のサービスとの比較</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-text-light">他社A</span>
                <span className="font-medium">月額 5,500円〜</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-text-light">他社B</span>
                <span className="font-medium">月額 11,000円〜</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-text-light">他社C</span>
                <span className="font-medium">月額 21,000円〜</span>
              </div>
              <div className="flex justify-between items-center py-1.5 bg-accent/5 rounded-lg px-2">
                <span className="font-bold text-accent">サロンカルテ</span>
                <span className="font-bold text-accent">月額 2,980円</span>
              </div>
            </div>
            <p className="text-xs text-text-light mt-3">
              既存サービスは使わない機能も含めたパック料金。サロンカルテは必要な機能だけ選んでお支払いいただけます。
            </p>
          </div>
        </div>
      </Section>

      {/* 今後追加予定の機能 */}
      <Section title="今後追加予定の機能" icon="&#128640;">
        <div className="space-y-3">
          <p className="text-sm text-text-light">
            以下の機能は、必要な方だけオプションとして追加できる形を予定しています。
            ご要望に応じて開発の優先度を決めていきますので、気になる機能があればぜひ教えてください。
          </p>

          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border">
              <div className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">カウンセリングシート</h4>
                  <p className="text-xs text-text-light mt-0.5">
                    初回来店時にお客様自身がスマホで入力できるデジタル問診票
                  </p>
                </div>
                <span className="text-xs text-text-light whitespace-nowrap ml-3">+500円/月</span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">カルテPDF出力</h4>
                  <p className="text-xs text-text-light mt-0.5">
                    カルテを印刷用PDFに。お客様への施術報告書としても
                  </p>
                </div>
                <span className="text-xs text-text-light whitespace-nowrap ml-3">+300円/月</span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">写真容量の拡張</h4>
                  <p className="text-xs text-text-light mt-0.5">
                    保存容量を5GB → 20GBに拡張
                  </p>
                </div>
                <span className="text-xs text-text-light whitespace-nowrap ml-3">+500円/月</span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">来店分析（詳細版）</h4>
                  <p className="text-xs text-text-light mt-0.5">
                    リピート率・来店間隔トレンド・月別集計グラフ
                  </p>
                </div>
                <span className="text-xs text-text-light whitespace-nowrap ml-3">+500円/月</span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">LINE通知</h4>
                  <p className="text-xs text-text-light mt-0.5">
                    予約リマインドや施術後フォローを自動送信
                  </p>
                </div>
                <span className="text-xs text-text-light whitespace-nowrap ml-3">+1,000円/月</span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">データエクスポート</h4>
                  <p className="text-xs text-text-light mt-0.5">
                    顧客データ・施術記録をCSVファイルで出力
                  </p>
                </div>
                <span className="text-xs text-text-light whitespace-nowrap ml-3">+300円/月</span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">複数スタッフ対応</h4>
                  <p className="text-xs text-text-light mt-0.5">
                    スタッフアカウントの追加・権限管理
                  </p>
                </div>
                <span className="text-xs text-text-light whitespace-nowrap ml-3">+1,000円/月</span>
              </div>
            </div>
          </div>

          {/* 料金シミュレーション */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h4 className="font-bold text-sm mb-3">料金シミュレーション</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-text-light">基本プランだけ</span>
                <span className="font-bold">月 2,980円</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-light">+ カウンセリング + PDF出力</span>
                <span className="font-bold">月 3,780円</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-light">全部入り</span>
                <span className="font-bold">月 7,080円</span>
              </div>
            </div>
            <p className="text-xs text-text-light mt-3">
              使いたい機能だけ選べるので、不要な機能にお金を払う必要はありません。
            </p>
          </div>
        </div>
      </Section>

      {/* サポート */}
      <div className="bg-surface border border-border rounded-2xl p-4 text-center">
        <p className="text-sm text-text-light">
          ご不明な点やご要望がありましたら、お気軽にご連絡ください。
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-3 bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-6 py-3 transition-colors text-sm min-h-[48px]"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
