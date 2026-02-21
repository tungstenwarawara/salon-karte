/** 今後追加予定の機能セクション */

const FUTURE_OPTIONS = [
  { name: "カウンセリングシート", desc: "初回来店時にお客様自身がスマホで入力できるデジタル問診票", price: "+500円/月" },
  { name: "LINE連携", desc: "予約リマインド・施術後フォロー・来店促進メッセージを自動送信", price: "+1,500円/月" },
  { name: "カルテPDF出力", desc: "カルテを印刷用PDFに。お客様への施術報告書としても", price: "+300円/月" },
  { name: "写真容量の拡張", desc: "保存容量を5GB → 20GBに拡張（約5,000〜10,000枚）", price: "+500円/月" },
  { name: "詳細分析レポート", desc: "リピート率・顧客LTV・メニュー別収益・月次比較グラフ", price: "+500円/月" },
  { name: "Web予約ページ", desc: "お客様がスマホから24時間予約できる専用ページを自動生成", price: "+1,500円/月" },
  { name: "複数スタッフ対応", desc: "スタッフアカウントの追加・閲覧/編集の権限管理", price: "+1,500円/月" },
];

const SIMULATIONS = [
  { label: "基本プランだけ", price: "月 2,980円" },
  { label: "+ カウンセリングシート", price: "月 3,480円" },
  { label: "+ LINE連携", price: "月 4,480円" },
  { label: "しっかり管理セット", price: "月 5,280円" },
];

export function GuideFutureFeatures() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-light">
        以下の機能は、必要な方だけオプションとして追加できる形を予定しています。
        ご要望に応じて開発の優先度を決めていきますので、気になる機能があればぜひ教えてください。
      </p>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-border">
          {FUTURE_OPTIONS.map((opt) => (
            <div key={opt.name} className="p-3 flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{opt.name}</h4>
                <p className="text-xs text-text-light mt-0.5">{opt.desc}</p>
              </div>
              <span className="text-xs text-text-light whitespace-nowrap ml-3">{opt.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 料金シミュレーション */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h4 className="font-bold text-sm mb-3">料金シミュレーション</h4>
        <div className="space-y-2 text-sm">
          {SIMULATIONS.map((s) => (
            <div key={s.label} className="flex justify-between items-center">
              <span className="text-text-light">{s.label}</span>
              <span className="font-bold">{s.price}</span>
            </div>
          ))}
          <div className="flex justify-between items-center border-t border-border pt-2 mt-1">
            <span className="text-text-light">全部入り</span>
            <span className="font-bold">月 9,260円</span>
          </div>
        </div>
        <p className="text-xs text-text-light mt-3">
          全部入りでも他社サービスより安価。使いたい機能だけ選べるので無駄がありません。
        </p>
      </div>
    </div>
  );
}
