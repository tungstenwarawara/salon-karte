/** よくある質問セクション — アコーディオン */

const FAQ_ITEMS = [
  {
    category: "基本",
    items: [
      { q: "スマホでもパソコンでも使えますか？", a: "はい、スマホ・タブレット・パソコンのすべてに対応しています。スマホでの操作に最適化されているので、施術の合間にサッと記録できます。" },
      { q: "カルテの入力欄に文字数制限はありますか？", a: "いいえ、文字数に上限はありません。会話メモや施術の詳細など、必要なだけ長文を入力できます。入力欄は文字量に合わせて自動で広がります。" },
      { q: "ホットペッパーとの連携はできますか？", a: "自動連携には対応していませんが、ホットペッパーで受けた予約を手動で登録して一元管理できます。予約元に「ホットペッパー」を選択すると、どのチャネルからの予約かも記録できます。" },
    ],
  },
  {
    category: "写真・データ",
    items: [
      { q: "写真はどこに保存されますか？", a: "クラウド上の暗号化された非公開ストレージに安全に保存されます。URLを知っていても直接アクセスできません。同じサロンに所属するオーナー・スタッフ全員が閲覧可能です。" },
      { q: "写真はどのくらい保存できますか？", a: "スタンダードプランでは5GBまで。1枚あたり約2〜5MBとして、約1,000〜2,500枚の写真を保存可能です。JPEG、PNG、WebP、HEIC対応。写真容量アップオプション（+500円/月）で20GBに拡張できます。" },
      { q: "確定申告に使えるデータは出力できますか？", a: "はい。「経営」→「在庫管理」→「売上・仕入レポート」で年間の売上・仕入・在庫明細を確認できます。freee・マネーフォワード・弥生に取り込める仕訳CSVは「設定」→「データエクスポート」からダウンロードできます。" },
      { q: "顧客データを削除したらどうなりますか？", a: "顧客データを削除すると、その顧客に紐づく施術記録・写真・予約もすべて完全に削除されます。この操作は取り消せないため、慎重に行ってください。" },
    ],
  },
  {
    category: "機能",
    items: [
      { q: "在庫管理は必ず使う必要がありますか？", a: "いいえ、必須ではありません。商品を登録しなければ在庫機能は一切表示されません。物販の記録自体は在庫管理なしでも「自由入力」モードで行えます。" },
      { q: "去年の繰越在庫はどう設定すればいいですか？", a: "「経営」→「在庫管理」→「棚卸し」で現在の手元在庫数を入力するだけでOKです。過去の全履歴は不要。その後は仕入れと販売を記録していくだけで自動計算されます。" },
      { q: "LINE連携はどうやって設定しますか？", a: "LINE公式アカウントが必要です。「設定」→「LINE連携」から3ステップで接続できます。個人サロンの規模（月50〜100通程度）であればLINE側の無料枠内で収まります。" },
      { q: "カウンセリングシートはどう使いますか？", a: "まず「設定」→「カウンセリングテンプレート」でテンプレートを作成します。シートの発行は、顧客詳細の「カウンセリング」タブまたは予約詳細画面から行います。QRコード・リンクでお客様に共有でき、回答は顧客データに自動保存されます。" },
      { q: "売上分析やLTVはどこで見られますか？", a: "下部ナビゲーション「経営」→「売上分析」タブからアクセスできます。顧客LTVランキング、新規/リピーター月別推移、メニュー別ランキングを確認できます。" },
    ],
  },
  {
    category: "料金",
    items: [
      { q: "おためしプランからスタンダードへの切り替えは？", a: "おためしプランの上限（顧客10件・カルテ1顧客あたり5件・予約月20件）に達した際にアップグレードのご案内が表示されます。データはそのまま引き継がれます。" },
    ],
  },
];

export function GuideFaqSection() {
  return (
    <div className="space-y-5">
      {FAQ_ITEMS.map(({ category, items }) => (
        <div key={category}>
          <p className="text-xs font-bold text-text-light mb-2 uppercase tracking-wider">
            {category}
          </p>
          <div className="space-y-2">
            {items.map(({ q, a }) => (
              <details
                key={q}
                className="bg-surface border border-border rounded-xl overflow-hidden group"
              >
                <summary className="font-medium text-sm p-4 cursor-pointer hover:bg-background transition-colors list-none flex items-center justify-between gap-3 min-h-[48px]">
                  <span>{q}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 flex-shrink-0 text-text-light group-open:rotate-180 transition-transform"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 text-sm text-text-light leading-relaxed">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
